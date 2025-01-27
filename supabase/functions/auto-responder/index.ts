import { serve } from "std/http/server";
import { corsHeaders } from '../_shared/cors.ts';
import OpenAI from "openai";
import { Client as LangSmith } from "langsmith";
import { createClient } from '@supabase/supabase-js'

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: {
    id: string;
    content: string;
    sender_type: string;
    conversation_id: string;
    created_at: string;
    sentiment_score: number | null;
  };
  old_record: null | any;
}


interface GenerateSupportResponsePayload {
  conversationContext: {
    messages: { content: string; sender_type: string }[];
    customer: { first_name: string | null; last_name: string | null };
    customer_company: { name: string };
  };
  metadata: {
    conversationId: string;
    customerId: string;
    companyId: string;
  };
}

interface AnalyzeSentimentPayload {
  message: string;
  metadata: {
    messageId: string;
    conversationId: string;
  };
}

interface TicketClassification {
  issue_type: string;
  confidence: number;
  summary: string;
}

// Initialize clients
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const langsmith = new LangSmith({
  apiUrl: Deno.env.get('LANGSMITH_ENDPOINT') || "https://api.smith.langchain.com",
  apiKey: Deno.env.get('LANGSMITH_API_KEY'),
});

const projectName = Deno.env.get('LANGSMITH_PROJECT') || "default";

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Helper function to create and manage Langsmith runs
async function withLangsmithTracking<T>(
  name: string,
  inputs: any,
  operation: () => Promise<T>
): Promise<T> {
  const runId = crypto.randomUUID();
  
  await langsmith.createRun({
    name,
    id: runId,
    run_type: "chain",
    inputs,
    project_name: projectName,
  });

  try {
    const result = await operation();
    await langsmith.updateRun(runId, {
      outputs: result,
      end_time: Date.now(),
    });
    return result;
  } catch (error) {
    await langsmith.updateRun(runId, {
      error: error instanceof Error ? error.message : "Unknown error",
      end_time: Date.now(),
    });
    throw error;
  }
}

// Add after the withLangsmithTracking function
async function classifyTicket(content: string, conversationContext: any): Promise<TicketClassification> {
  const systemPrompt = `You are a support ticket classifier. Analyze the following message and conversation context to:
1. Determine the primary issue type from these categories: technical_issue, billing_question, feature_request, bug_report, account_access, program_logistics, or other
2. Provide a confidence score between 0 and 1
3. Write a one-line summary of the issue

Return the response in this exact json format:
{
  "issue_type": "category_name",
  "confidence": 0.XX,
  "summary": "Brief description"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Message: ${content}\n\nContext: ${JSON.stringify(conversationContext)}` }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content || '{"issue_type":"other","confidence":0,"summary":"Failed to classify"}');
}

serve(async (req) => {
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`) {
      console.error('Authorization failed:', { 
        received: authHeader?.substring(0, 10) + '...',
        expected: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')?.substring(0, 10)}...`
      });
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));
    
    // Handle webhook payload
    if ('type' in payload && payload.type === 'INSERT') {
      const webhookPayload = payload as WebhookPayload;
      const record = webhookPayload.record;
      
      console.log('Processing webhook payload:', {
        type: webhookPayload.type,
        table: webhookPayload.table,
        messageId: record.id,
        senderType: record.sender_type
      });
      
      // Only process messages table webhooks
      if (webhookPayload.table !== 'messages') {
        console.log('Ignoring non-messages table webhook:', webhookPayload.table);
        return new Response(JSON.stringify({ message: 'Ignored - not messages table' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Only process customer messages
      if (record.sender_type === 'customer') {
        console.log('Processing customer message for auto-response:', {
          messageId: record.id,
          content: record.content.substring(0, 50) + '...'
        });

        // Fetch conversation context
        const { data: conversationData, error: conversationError } = await supabaseClient
          .from('conversations')
          .select(`
            id,
            customer:customers(first_name, last_name, company:customer_companies(name)),
            account:accounts(name),
            messages(content, sender_type)
          `)
          .eq('id', record.conversation_id)
          .single();

        if (conversationError) {
          throw conversationError;
        }

        // First, classify the ticket
        const classification = await withLangsmithTracking("classify_ticket",
          { message: record.content, context: conversationData },
          async () => await classifyTicket(record.content, conversationData)
        );

        console.log('Ticket classification result:', classification);

        // If confidence is low, create a ticket
        if (classification.confidence < 0.8) {
          const { error: ticketError } = await supabaseClient
            .from('tickets')
            .insert({
              conversation_id: record.conversation_id,
              issue_type: classification.issue_type,
              summary: classification.summary,
              status: 'pending_assignment',
              confidence_score: classification.confidence
            });

          if (ticketError) {
            console.error('Error creating ticket:', ticketError);
          } else {
            console.log('Created ticket for low-confidence conversation');
          }
        }

        // Generate auto-response
        const messages = conversationData.messages.map(msg => ({
          role: msg.sender_type === 'customer' ? 'user' : 'assistant',
          content: msg.content
        }));

        const systemPrompt = `You are an official customer support representative for ${conversationData.account.name} specializing in in guiding applicants, enrolled engineers, and hiring partners through program logistics, technical support, career placement, and ensuring a seamless experience in the 12-week AI training journey. This is an advanced program with rules and guidelines that needs to be followed properly. 
                  
        Customer: ${conversationData.customer.first_name} ${conversationData.customer.last_name}

        Respond to this query: 
        ${record.content}
        
        Respond using these conversational patterns:
        - Match user's message length (±15%)
        - Mirror their tone (formal/casual/urgent)
        - Use 70% simple words (1-2 syllables)
        - Max 1 emoji per 3 messages
        - Allow natural digressions
        - Don't say Hi unless the customer says Hi
        - Don't use their name. 
        Occasionally use:
        - Mild humor
        - Personal pronouns
        - Time references

        Previous Conversation:
        ${messages.map(msg => `${msg.role === 'user' ? 'Customer' : 'Customer Support'}: ${msg.content}`).join('\n')}`;

        const maxLength = Math.floor(Math.min(
          record.content.length * 1.5, 
          150 
        ));

        const result = await withLangsmithTracking("generate_auto_response", 
          { 
            conversation: conversationData,
            currentMessage: {
              id: record.id,
              content: record.content,
              sender_type: record.sender_type
            },
            openai_request: {
              system_prompt: systemPrompt,
              messages: messages,
              model: "gpt-4o-mini",
              temperature: 0.7,
              max_tokens: maxLength
            }
          }, 
          async () => {
            console.log('Calling OpenAI for response generation');
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
              ],
              temperature: 0.7,
              response_format: { type: "text" },
              max_tokens: maxLength,
              stop: ["\n\n", "Note:", "As a"]
            });

            const response = completion.choices[0].message.content;
            
            // Insert the auto-response
            const { error: insertError } = await supabaseClient
              .from('messages')
              .insert({
                conversation_id: record.conversation_id,
                content: response,
                sender_type: 'ai'
              });

            if (insertError) {
              throw insertError;
            }

            return { 
              response,
              message_id: record.id 
            };
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
  

    // If we get here, the request wasn't handled
    return new Response(JSON.stringify({ message: 'No action required' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in support-assistant:', {
      error: error.message,
      stack: error.stack,
      details: error.toString()
    });
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 