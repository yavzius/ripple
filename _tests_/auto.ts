import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import {
    StateGraph,
    END,
    START,
    Annotation,
    MessagesAnnotation
  } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, BaseMessageLike } from "@langchain/core/messages";
import { StructuredOutputParser } from "langchain/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
dotenv.config();


const GraphAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    conversationId: Annotation<string>(),
    company_name: Annotation<string>(),
    email: Annotation<string>(),
    first_name: Annotation<string>(),
    last_name: Annotation<string>(),
    lastMessage: Annotation<string>(),
  });

  async function conversationalAgent(
    state: typeof GraphAnnotation.State
  ) {
    const { messages, company_name, email, first_name, last_name } = state;
  
    // Identify missing details
    const missing: string[] = [];
    if (!first_name && !last_name) {
      missing.push("name");
    } else {
      if (!first_name) missing.push("first name");
      if (!last_name) missing.push("last name"); 
    }
    if (!email) missing.push("email");
    if (!company_name) missing.push("company name");
  
    let systemPrompt = "You are a helpful agent that guides the user.";
    if (missing.length > 0) {
      // Dynamically tell the LLM which details we still need
      systemPrompt += ` Ask the user (politely and conversationally) for: ${missing.join(", ")}. 
        If any detail has been provided in the conversation, do not ask for it again. 
        You MUST confirm you have all user details before proceeding to steps related to buying products.`;
    } else {
      // Safely say something like: "We have all the info. Let's proceed!"
      systemPrompt += ` You have collected all user details (name, email, company). 
        Please proceed with general help or product purchase steps.`;
    }
  
    const response = await llm.invoke([
      {
        role: "system",
        content: systemPrompt
      },
      ...messages,
    ]);
    
    const updatedMessages = [...messages, { role: "assistant", content: response.content }];
  
    return { messages: updatedMessages };
  }

  const fetchConversationTool = async (input: { conversationId: string, lastMessage: string }) => {
    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('state')
            .eq('id', input.conversationId)
            .single();
        if (error) throw error;

        const {state} = data;
        console.log(`state: ${JSON.stringify(state)}`)

        const newMessage = new HumanMessage(input.lastMessage)

        return {
            ...state,
            conversationId: input.conversationId,
            messages: [...(state?.messages ?? []), newMessage],
        };
    } catch (error) {
        console.error("Database operation failed:", error);
        return { messages: [] };
    }
}

const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o-mini",
  })

let userDetailsSchema = z.object({
    email: z.optional(z.string()).describe("User's email address"),
    first_name: z.optional(z.string()).describe("User's first name"),
    last_name: z.optional(z.string()).describe("User's last name"),
    company_name: z.optional(z.string()).describe("User's company name"),
  }).describe("User's details required to sign them up");

const userDetailsParser = StructuredOutputParser.fromZodSchema(userDetailsSchema);

const extractionPrompt = ChatPromptTemplate.fromTemplate("Extract user details from the final user message below. Respond ONLY with JSON containing any of: email, first_name, last_name, company_name.");
 
const chain = RunnableSequence.from([
    extractionPrompt,
    llm,
    userDetailsParser,
  ]);

const extractDetails = async (state: typeof GraphAnnotation.State) => {
    try {
        const { messages } = state;
        //get all messages
        const allMessages = messages.map(message => message.content).join('\n');
        console.log(`extracting details from ${allMessages}`)
        return chain.invoke({query: allMessages})
            .then((response) => {
                console.log(response)
                return { ...state, ...response };
            })
            .catch((error) => {
                console.error("Detail extraction failed:", error);
                return state;
            });
    } catch (error) {
        console.error("Detail extraction failed:", error);
    }
    return {};
}

function saveStateToDatabase(state: typeof GraphAnnotation.State) {
    const { conversationId, company_name, email, first_name, last_name } = state;
    console.log("Saving state →", state);
    return supabase
        .from("conversations")
        .update({ state })
        .eq("id", conversationId)
        .then(({ data, error }) => {
            if (error) console.error("Error:", error);
            else console.log("Update successful:", data);
        });
}



const workflow = new StateGraph(GraphAnnotation)
    .addNode("agent", conversationalAgent)
    .addNode("fetchConversation", fetchConversationTool)
    .addNode("extractDetails", extractDetails)
    .addNode("saveStateToDatabase", saveStateToDatabase)
    .addEdge(START, "fetchConversation")
    .addEdge("fetchConversation", "extractDetails")
    .addEdge("extractDetails", "agent")
    .addEdge("agent", "saveStateToDatabase")
    .addEdge("saveStateToDatabase", END)
    
const app = workflow.compile();


const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);


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
    id: '5bf5b9cd-e62f-4c4b-b447-5026894d4c3d',
    content: 'of course I will. ',
    sender_type: 'customer',
    conversation_id: '9b598fcf-ab04-4389-bc0a-dc57b9429a91',
    created_at: '2025-01-29T12:00:00Z',
    sentiment_score: null,
  },
  old_record: null,
};

const result = await app.invoke({conversationId: "5bf5b9cd-e62f-4c4b-b447-5026894d4c3d", lastMessage: payload.record.content})
console.log(result.messages[result.messages.length - 1].content)

