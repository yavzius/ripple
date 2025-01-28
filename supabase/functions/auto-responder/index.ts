import { corsHeaders } from '../_shared/cors.ts';
import { ChatOpenAI } from "@langchain/openai";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { createClient } from "@supabase/supabase-js";

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

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.5
});

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const response = await llm.invoke(state.messages);
  return { messages: response };
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);


const app = workflow.compile();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

const getMessages = async (conversation_id: string) => {
  const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversation_id);
  // format the array to be an array of objects with role and content
  const messages = data?.map((message) => ({ role: message.sender_type === 'customer' ? 'user' : 'assistant', content: message.content }));
  return messages;
}


const processMessage = async (payload: WebhookPayload) => {
  const config = { configurable: { thread_id: payload.record.conversation_id } };
  const messageHistory = await getMessages(payload.record.conversation_id);
  const input = [
    {
      role: "user",
      content: payload.record.content,
    },
  ];
  const messages = [...(messageHistory ?? []), ...input];
  const output = await app.invoke({ messages: messages }, config);
  console.log(output.messages[output.messages.length - 1]);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as WebhookPayload;
    
    if (payload.type === 'INSERT' && payload.record.sender_type === 'customer') {
      await processMessage(payload);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 