import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { z } from "zod";
import { Annotation, MessagesAnnotation, END, START, StateGraph, Command } from "@langchain/langgraph";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const GraphAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    accountId: Annotation<string>(),
    customerCompanyId: Annotation<string>(),
    orderId: Annotation<string>(),
});

type State = typeof GraphAnnotation.State;


const findCustomerCompany = tool(async (input, config) => {
  console.log("findCustomerCompany state:", input.customerCompanyName);
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
  console.warn(`found customer company: ${matches[0].id}`);

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

const createOrder = tool(async (input, config) => {
  const { customerCompanyId, accountId } = input; 
  if (!input.accountId) throw new Error("Account ID is missing");
  
  const { data: order, error } = await supabase
    .from('orders')
    .insert([{
      company_id: input.customerCompanyId,
      account_id: input.accountId,
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



const tools = [findCustomerCompany, createOrder];
const toolNode = new ToolNode(tools);

const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o-mini",
}).bindTools(tools);

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

const graph = new StateGraph(GraphAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue, ["tools", END]);

const app = graph.compile();

async function runTests() {
    const testCases = [
      "Create an order for Pure Aesthetics Chain",
    ];

    console.log("Starting order creation tests...\n");
    
    for (const prompt of testCases) {
      console.log("=".repeat(50));
      console.log(`Testing prompt: "${prompt}"`);
      const accountId = "f48d2d7d-39a5-4e2a-9557-5a5b0ccc04a2";
      const newPrompt = prompt + " and return the order ID. THe account this order should be crreated is: " + accountId;
      
  
      try {
        const result = await app.invoke({ 
            messages: [new HumanMessage(newPrompt)]
        });
        // Update the success check
        if (result.orderId) {
          console.log("Test result: PASSED");
          console.log("Created order:", result.orderId);
          return result.orderId;
        } else {
          console.log("Test result: FAILED");
          console.log("No order ID returned");
        }
      } catch (error) {
        console.log("Test result: FAILED");
        console.error("Error:", error);
      }
      console.log("=".repeat(50), "\n");
    }
  }
  
runTests().catch(console.error);
