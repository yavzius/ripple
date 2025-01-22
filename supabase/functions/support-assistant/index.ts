import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"
import { corsHeaders } from '../_shared/cors.ts'
import OpenAI from "https://esm.sh/openai@4.24.1"
import { Client } from "https://esm.sh/langsmith@0.1.3"

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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create authenticated Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${authHeader}` } },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(authHeader)

    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Initialize LangSmith client
    const langsmith = new Client({
      apiUrl: Deno.env.get('LANGSMITH_ENDPOINT') || "https://api.smith.langchain.com",
      apiKey: Deno.env.get('LANGSMITH_API_KEY'),
    });

    const projectName = Deno.env.get('LANGSMITH_PROJECT') || "ripple";

    // Get the request path and payload
    const { pathname } = new URL(req.url);
    const payload = await req.json();

    // Handle different endpoints
    switch (pathname) {
      case "/generate-response": {
        const { conversationContext, metadata } = payload as GenerateSupportResponsePayload;
        
        // Generate a unique run ID
        const runId = crypto.randomUUID();
        
        // Start a new run in LangSmith
        await langsmith.createRun({
          name: "support_response_generation",
          id: runId,
          run_type: "chain",
          inputs: {
            conversation: conversationContext,
            metadata: metadata,
          },
          project_name: projectName,
          extra: {
            conversation_id: metadata.conversationId,
          },
        });

        try {
          // Format conversation history for context
          const history = conversationContext.messages
            .map((msg) => `${msg.sender_type}: ${msg.content}`)
            .join("\n");

          const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are a customer support AI assistant.
                         Analyze the conversation and provide a helpful response.
                         Also provide a confidence score (0-1) indicating how certain you are about your response.
                         Customer: ${conversationContext.customer.first_name} ${conversationContext.customer.last_name}
                         Company: ${conversationContext.customer_company.name}`,
              },
              {
                role: "user",
                content: `Conversation history:\n${history}\n\nProvide response and confidence score.`,
              },
            ],
            functions: [
              {
                name: "provide_response",
                parameters: {
                  type: "object",
                  properties: {
                    response: { type: "string" },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    reasoning: { type: "string" },
                  },
                  required: ["response", "confidence", "reasoning"],
                },
              },
            ],
            function_call: { name: "provide_response" },
          });

          const functionCall = response.choices[0].message.function_call;
          const { response: aiResponse, confidence, reasoning } = JSON.parse(
            functionCall!.arguments
          );

          // Update LangSmith run with the results
          await langsmith.updateRun(runId, {
            outputs: {
              response: aiResponse,
              confidence,
              reasoning,
            },
            end_time: Date.now(),
          });

          return new Response(
            JSON.stringify({ response: aiResponse, confidence }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        } catch (error) {
          // Log error to LangSmith
          await langsmith.updateRun(runId, {
            error: error instanceof Error ? error.message : "Unknown error",
            end_time: Date.now(),
          });
          throw error;
        }
      }

      case "/analyze-sentiment": {
        const { message, metadata } = payload as AnalyzeSentimentPayload;
        
        // Generate a unique run ID
        const runId = crypto.randomUUID();
        
        await langsmith.createRun({
          name: "sentiment_analysis",
          id: runId,
          run_type: "chain",
          inputs: {
            message,
            metadata,
          },
          project_name: projectName,
          extra: {
            message_id: metadata.messageId,
            conversation_id: metadata.conversationId,
          },
        });

        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are a sentiment analysis expert. Analyze the following message and provide a happiness score between 0 and 1, where 0 is very unhappy and 1 is very happy.",
              },
              {
                role: "user",
                content: message,
              },
            ],
            functions: [
              {
                name: "analyze_sentiment",
                parameters: {
                  type: "object",
                  properties: {
                    happiness_score: { type: "number", minimum: 0, maximum: 1 },
                    reasoning: { type: "string" },
                  },
                  required: ["happiness_score", "reasoning"],
                },
              },
            ],
            function_call: { name: "analyze_sentiment" },
          });

          const functionCall = response.choices[0].message.function_call;
          const { happiness_score, reasoning } = JSON.parse(functionCall!.arguments);

          // Update LangSmith run with the results
          await langsmith.updateRun(runId, {
            outputs: {
              happiness_score,
              reasoning,
            },
            end_time: Date.now(),
          });

          return new Response(
            JSON.stringify({ happiness_score }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        } catch (error) {
          // Log error to LangSmith
          await langsmith.updateRun(runId, {
            error: error instanceof Error ? error.message : "Unknown error",
            end_time: Date.now(),
          });
          throw error;
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 