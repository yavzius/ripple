// @deno-types="npm:@types/node"

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { z } from "zod";
import { Annotation, MessagesAnnotation, END, START, StateGraph, Command } from "@langchain/langgraph";
import { corsHeaders } from '../_shared/cors.ts';
import { traceable } from "langsmith/traceable";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Graph state annotation
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  accountId: Annotation<string>(),
  customerCompanyId: Annotation<string>(),
  orderId: Annotation<string>(),
});

type State = typeof GraphAnnotation.State;

// Tool to find customer company
const findCustomerCompany = tool(async (input, config) => {
  const { data: matches, error } = await supabase
    .from('customer_companies')
    .select('id, name')
    .ilike('name', `%${input.customerCompanyName}%`)
    .limit(1);

  if (error) throw new Error(`Error fetching accounts: ${error.message}`);
  if (!matches?.length) return { 
    messages: [{ 
      type: 'tool', 
      content: `No account found matching "${input.customerCompanyName}"` 
    }]
  };

  return new Command({
    update: {
      customerCompanyId: matches[0].id,
      messages: [
        new ToolMessage({
          tool_call_id: config.toolCall.id,
          content: `Customer company found with ID: ${matches[0].id} Now create an order`
        })
      ]
    },
  });
}, {
  name: "find_customer_company",
  description: "Find a customer company by name using fuzzy matching",
  schema: z.object({
    customerCompanyName: z.string().describe("The name of the customer company to find"),
  }),
});

// Tool to create order
const createOrder = tool(async (input, config) => {
  const { customerCompanyId, accountId } = input;
  if (!accountId) throw new Error("Account ID is missing");
  
  const { data: order, error } = await supabase
    .from('orders')
    .insert([{
      company_id: customerCompanyId,
      account_id: accountId,
      status: 'new',
    }])
    .select()
    .single();

  if (error) throw new Error(`Error creating order: ${error.message}`);
  
  return new Command({
    update: {
      orderId: order.id,
      messages: [
        new ToolMessage({
          tool_call_id: config.toolCall.id,
          content: `Order created successfully with ID: ${order.id}. TERMINATE.`
        })
      ]
    },
  });
}, {
  name: "create_order",
  description: "Create a new order for an account",
  schema: z.object({
    customerCompanyId: z.string().describe("The ID of the customer company to create the order for"),
    accountId: z.string().describe("The ID of the account to create the order for"),
  }),
  returnDirect: false
});

// Initialize tools and LLM
const tools = [findCustomerCompany, createOrder];
const toolNode = new ToolNode(tools);

const llm = new ChatOpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
  modelName: "gpt-4o-mini",
}).bindTools(tools);

// Graph control flow
function shouldContinue(state: typeof GraphAnnotation.State) {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls?.length) {
    return "tools";
  }
  return END;
}

async function callModel(state: typeof GraphAnnotation.State) {
  const { messages } = state;
  const response = await llm.invoke(messages);
  return { messages: response };
}

// Create and compile the graph
const graph = new StateGraph(GraphAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue, ["tools", END]);

const app = graph.compile();

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const { prompt, accountId } = await req.json();

    if (!prompt || !accountId) {
      return new Response(
        JSON.stringify({ error: 'Prompt and accountId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Run the graph with the input
    const result = await app.invoke({ 
      messages: [new HumanMessage(prompt + ` and return the order ID. The account this order should be created is: ${accountId}`)],
      accountId // Add accountId to the initial state
    });

    return new Response(
      JSON.stringify({
        success: true,
        orderId: result.orderId,
        customerCompanyId: result.customerCompanyId,
        message: result.messages[result.messages.length - 1].content
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 
