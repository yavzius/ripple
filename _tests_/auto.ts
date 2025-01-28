import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { traceable } from "langsmith/traceable";
import { wrapOpenAI } from "langsmith/wrappers";
import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ToolNode } from '@langchain/langgraph/prebuilt';
import {
    StateGraph,
    MessagesAnnotation,
    END,
    START,
    Annotation
  } from "@langchain/langgraph";
import { tool } from '@langchain/core/tools';
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
dotenv.config();

const StateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    nextRepresentative: Annotation<string>,
  });

const multiply = tool(
    ({ a, b }: { a: number; b: number }): number => {
        return a * b;
    },
    {
        name: "multiply",
        description: "Multiply two numbers",
        schema: z.object({
        a: z.number(),
        b: z.number(),
        }),
    }
);

async function getShopifyProductPrice(handle: string) {
    try {
        const response = await fetch(`https://glytone.com/products/${handle}.json`);
        const data = await response.json();
        if (!data.product || !data.product.variants || !data.product.variants[0]) {
            throw new Error("A product with this handle does not exist");
        }
        return data.product.variants[0].price;
    } catch (error) {
        throw new Error("Price fetch failed");
    }
}

const getProductPrice = tool(
     async ({handle}: {handle: string}) => {
        if (!handle) {
            throw new Error("Handle is required");
        }
        const price = await getShopifyProductPrice(handle);
        return price;
    },
    {
        name: "getProductPrice",
        description: "Get the price of a product",
        schema: z.object({
            handle: z.string(),
        }),
    }
);


const tools = [multiply, getProductPrice];
const toolNode = new ToolNode(tools)


const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o-mini",
}).bindTools(tools);

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls?.length) {
        return "tools";
    }
    return END;
}

const callModel = async (state: typeof MessagesAnnotation.State) => {
    const { messages } = state;
    const response = await llm.invoke(messages);
    return { messages: response };
}

const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, ["tools", END])
    .addEdge("tools", "agent")

const app = workflow.compile();


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);



type Message = {
  role: "user" | "assistant" | "system" | "tool" | "function" | "developer" | "placeholder";
  content: string;
}

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

const payload: WebhookPayload = {
  type: 'INSERT',
  table: 'messages',
  schema: 'public',
  record: {
    id: '054203c0-7621-4c5e-b7df-3a3825e6062a',
    content: 'how much is the glytone serum with handle "enhance-brightening-complex"?',
    sender_type: 'customer',
    conversation_id: '9b598fcf-ab04-4389-bc0a-dc57b9429a91',
    created_at: '2025-01-29T12:00:00Z',
    sentiment_score: null,
  },
  old_record: null,
};

const retriever = traceable(
    async function getMessages(conversation_id: string): Promise<Message[]> {
    try {
        const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversation_id);
        if (error) throw error;
        
        return data?.map((message) => ({
        role: message.sender_type === 'customer' ? 'user' : 'assistant',
        content: message.content
        })) ?? [];
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
    },
    { run_type: "retriever" }
);

const generate_response = traceable(async function generate_response({message, conversation_id}: {message: string, conversation_id: string}) {
  try {
    const conversationMessages = await retriever(conversation_id);
    const messages = [
      { role: "system", content: "You are a helpful assistant" },
      ...conversationMessages.map(msg => ({ role: msg.role, content: msg.content })),
      { role: "user", content: message }
    ];

    const res = await llm.invoke(messages);

    const tool_call = res.tool_calls?.[0];
    if (tool_call) {
      const tool_result = await toolNode.invoke({ messages: [res] });
      console.log(tool_result);
    }
    return res

  } catch (error) {
    console.error('Error in response generation:', error);
    throw error;
  }
});



const stream = await app.stream(
    {
      messages: [{ role: "user", content: "what's 15 times the number of fingers of a human?" }],
    },
    {
      streamMode: "values"
    }
  )
  for await (const chunk of stream) {
    const lastMessage = chunk.messages[chunk.messages.length - 1];
    const type = lastMessage._getType();
    const content = lastMessage.content;
    const toolCalls = lastMessage.tool_calls;
    console.dir({
      type,
      content,
      toolCalls
    }, { depth: null });
  }

