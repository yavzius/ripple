import { createClient } from "@supabase/supabase-js";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { z } from "zod";
import { Annotation, MessagesAnnotation, END, START, StateGraph, Command } from "@langchain/langgraph";
import { corsHeaders } from '../_shared/cors.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Graph state annotation
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
});


// Tool to find customer company
const findCustomerCompany = tool(async (input, config) => {
  const { data: matches, error } = await supabase
    .from('customer_companies')
    .select('id, name')
    .ilike('name', `%${input.customerCompanyName}%`)
    .limit(1);

  if (error) throw new Error(`Error fetching customer companies: ${error.message}`);
  if (!matches?.length) return { 
    messages: [{ 
      type: 'tool', 
      content: `No customer company found matching "${input.customerCompanyName}"` 
    }]
  };
  return {
    customerCompanyId: matches[0].id,
  }
}, {
  name: "find_customer_company",
  description: "Find a customer company ID by name using fuzzy matching",
  schema: z.object({
    customerCompanyName: z.string().describe("The name of the customer company to find"),
  }),
});

const findProducts = tool(async (input, config) => {
  const { accountId, productRequests } = input;
  
  if (!accountId) throw new Error("Account ID is missing");

  const foundProducts: Array<{ id: string; quantity: number }> = [];
  const notFoundProducts: string[] = [];

  const { data: allProducts, error: productsError } = await supabase
    .from('products')
    .select('id, name')
    .eq('account_id', accountId);

  if (productsError) {
    throw new Error(`Error fetching products: ${productsError.message}`);
  }

  // Create a map for faster lookups
  const productMap = new Map(
    allProducts?.map(p => [p.name.toLowerCase(), p]) || []
  );

  // Process each product request
  for (const request of productRequests) {
    const searchName = request.name.toLowerCase();
    
    // Try exact match first
    let match = productMap.get(searchName);

    // If no exact match, try fuzzy match
    if (!match && allProducts) {
      match = allProducts.find(p => 
        p.name.toLowerCase().includes(searchName) || 
        searchName.includes(p.name.toLowerCase())
      );
    }

    if (match) {
      foundProducts.push({
        id: match.id,
        quantity: request.quantity || 1
      });
    } else {
      notFoundProducts.push(request.name);
    }
  }

  return {
    productIds: foundProducts,
  };
}, {
  name: "find_products",
  description: "Find products by name and return their exact IDs and quantities. Once products are found, their IDs must be used exactly as provided.",
  schema: z.object({
    accountId: z.string().describe("The ID of the account to search products in"),
    productRequests: z.array(
      z.object({
        name: z.string().describe("The name of the product to find"),
        quantity: z.number().optional().describe("The quantity of the product (defaults to 1)")
      })
    ).describe("Array of product requests with names and optional quantities"),
  }),
});

// Tool to create order
const createOrder = tool(async (input, config) => {
  const { customerCompanyId, accountId, productIds } = input;
  if (!accountId) throw new Error("Account ID is missing");
  if (!productIds?.length) throw new Error("No products selected");
  
  const { data: order, error } = await supabase
    .from('orders')
    .insert([{
      company_id: customerCompanyId,
      account_id: accountId,
      status: 'new',
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating order: ${error.message}`);
  }

  // Create order items with quantities
  const orderItems = productIds.map(product => ({
    order_id: order.id,
    product_id: product.id,
    quantity: product.quantity,
  }));

  const { data: createdItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (itemsError) {
    throw new Error(`Error creating order items: ${itemsError.message}`);
  }
  
  return new Command({
    update: {
      orderId: order.id,
      messages: [
        new ToolMessage({
          tool_call_id: config.toolCall.id,
          content: `Successfully created Order #${order.order_number} (ID: ${order.id}) with the following items: ${orderItems.map(item => `Product ID: ${item.product_id} (Quantity: ${item.quantity})`).join(', ')}. TERMINATE.`
        })
      ]
    },
  });
}, {
  name: "create_order",
  description: "Create a new order using the exact product IDs that were previously found. Do not modify or replace the product IDs.",
  schema: z.object({
    customerCompanyId: z.string().describe("The ID of the customer company to create the order for"),
    accountId: z.string().describe("The ID of the account to create the order for"),
    productIds: z.array(
      z.object({
        id: z.string().describe("The ID of the product"),
        quantity: z.number().describe("The quantity of the product")
      })
    ).describe("Array of product IDs and their quantities"),
  }),
  returnDirect: false
});

// Initialize tools and LLM
const tools = [findCustomerCompany, findProducts, createOrder];
const toolNode = new ToolNode(tools);

const llm = new ChatOpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
  modelName: "gpt-4o-mini",
}).bindTools(tools);

// Graph control flow
function shouldContinue(state: typeof GraphAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];

  if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls?.length) {
    return "tools";
  }

  return END;
}

async function callModel(state: typeof GraphAnnotation.State) {
  const { messages } = state;   
  const response = await llm.invoke(messages, {
    runName: "AutoCRM",
  });
  
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
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { prompt, accountId } = await req.json();

    if (!prompt || !accountId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Prompt and accountId are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data } = await supabase.auth.getUser(token)
    const user = data.user

    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found' 
        }),
        { status: 401 }
      );
    }

    const input = {
      messages: [
        new HumanMessage({
          content: `You are an assistant that helps with CRM actions: 
          Here is the request: ${prompt} 
          Here is the accountID: ${accountId}
          `
        })
      ]
    }

    for await (
      const event of await app.stream(input, {
        streamMode: "updates",
      })
    ) {
      let log = '';
      if (event?.agent) {
        const toolCall = event?.agent?.messages?.tool_calls[0]?.name || null
        if (toolCall === 'find_customer_company') {
          log = "Looking up the customer"
        } else if (toolCall === 'find_products') {
          log = "Looking up the products"
        } else if (toolCall === 'create_order') {
          log = "Creating the order"
        }
        if (event?.agent?.messages?.content) {
          log += `${event.agent.messages.content}`
        }
      }
      if (log) {
        console.log(log)
        await supabase.from('assistant_updates').insert({
          user_id: user.id,
          content: log,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in assistant function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 
