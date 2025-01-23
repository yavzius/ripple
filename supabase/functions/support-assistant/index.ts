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
        senderType: record.sender_type,
        sentimentScore: record.sentiment_score
      });
      
      // Only process messages table webhooks
      if (webhookPayload.table !== 'messages') {
        console.log('Ignoring non-messages table webhook:', webhookPayload.table);
        return new Response(JSON.stringify({ message: 'Ignored - not messages table' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Ensure this is a customer message that hasn't been analyzed
      if (record.sender_type === 'customer' && record.sentiment_score === null) {
        console.log('Processing customer message for sentiment analysis:', {
          messageId: record.id,
          content: record.content.substring(0, 50) + '...' // Log first 50 chars only
        });

        // Perform sentiment analysis
        const result = await withLangsmithTracking("analyze_sentiment", 
          { message: record.content }, 
          async () => {
            console.log('Calling OpenAI for sentiment analysis');
            const completion = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content: "Analyze the sentiment of the following message. Return a score between 0 (negative) and 1 (positive)."
                },
                { role: "user", content: record.content }
              ],
              max_tokens: 10
            });

            const scoreText = completion.choices[0].message.content || '0';
            const happiness_score = parseFloat(scoreText);
            
            console.log('Sentiment analysis result:', {
              messageId: record.id,
              score: happiness_score,
              rawScore: scoreText
            });

            // Update the message with the sentiment score
            console.log('Updating message with sentiment score');
            const { error: updateError } = await supabaseClient
              .from('messages')
              .update({ sentiment_score: happiness_score })
              .eq('id', record.id);

            if (updateError) {
              console.error('Error updating message:', updateError);
              throw updateError;
            }

            return { 
              happiness_score, 
              message_id: record.id 
            };
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        console.log('Skipping message:', {
          reason: record.sentiment_score !== null ? 'already analyzed' : 'not customer message',
          messageId: record.id,
          senderType: record.sender_type
        });
      }
    }
    
    // Handle direct API calls with action
    if ('action' in payload) {
      const { action, ...actionPayload } = payload;
      console.log('Received request:', { action, actionPayload }) // Debug log

      if (!action) {
        throw new Error('Action is required')
      }

      switch (action) {
        case 'generate-response': {
          const { conversationContext, metadata } = actionPayload;
          if (!conversationContext || !metadata) {
            throw new Error('Missing required fields');
          }
        
          const result = await withLangsmithTracking("generate_response", { conversationContext }, async () => {
            const messages = conversationContext.messages.map(msg => ({
              role: msg.sender_type === 'customer' ? 'user' : 'assistant',
              content: msg.content
            }));
        
            const completion = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content: `You are a helpful customer support assistant for ${conversationContext.customer_company.name}.`
                },
                ...messages
              ]
            });
        
            return {
              response: completion.choices[0].message.content,
              confidence: completion.choices[0].finish_reason === 'stop' ? 0.9 : 0.5
            };
          });
        
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        case 'analyze-sentiment': {
          const { message, metadata } = actionPayload;
          if (!message || !metadata) {
            throw new Error('Missing required fields');
          }
        
          const result = await withLangsmithTracking("analyze_sentiment", { message }, async () => {
            const completion = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content: "Analyze the sentiment of the following message. Return a score between 0 (negative) and 1 (positive)."
                },
                { role: "user", content: message }
              ]
            });

            const score = parseFloat(completion?.choices[0].message.content || '0');
            return { happiness_score: score };
          });
        
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        default:
          throw new Error(`Unknown action: ${action}`)
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