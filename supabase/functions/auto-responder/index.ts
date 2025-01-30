import { corsHeaders } from '../_shared/cors.ts';
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
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

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
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
  const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversation_id).order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error('Error getting messages:', error);
    return [];
  }
  return data?.map((message) => ({ role: message.sender_type === 'customer' ? 'user' : 'assistant', content: message.content }));
}

const createEmbedding = async (content: string): Promise<number[]> => {
  try {
    const embedding = await embeddings.embedQuery(content);
    if (!embedding || embedding.length === 0) {
      console.error('Failed to create embedding for content');
      return [];
    }
    return embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    return [];
  }
}

interface DocumentResult {
  id: string;
  content: string;
  title: string;
  similarity: number;
  category?: string | null;
}

interface SearchResult extends DocumentResult {
  source: 'vector' | 'text';
  score: number;
}

const searchDocuments = async (embedding: number[], searchText: string): Promise<DocumentResult[]> => {
  if (!embedding || embedding.length === 0) {
    console.error('Invalid embedding provided for search');
    return [];
  }

  try {
    // Try vector search first
    console.log('Attempting vector search...');
    const { data: vectorMatches, error: vectorError } = await supabase.rpc('match_documents', {
      query_embedding: `[${embedding.join(',')}]`,
      similarity_threshold: 0.2,
      match_count: 10
    });

    if (vectorError) {
      console.error('Error in vector search:', vectorError);
    } else {
      console.log('Vector matches found:', vectorMatches?.length || 0);
    }

    // Try text search
    console.log('Attempting text search...');
    const { data: textMatches, error: textError } = await supabase
      .from('documents')
      .select('id, content, title, category')
      .textSearch('content', searchText, {
        type: 'websearch',
        config: 'english'
      })
      .limit(10);

    if (textError) {
      console.error('Error in text search:', textError);
    } else {
      console.log('Text matches found:', textMatches?.length || 0);
    }

    // Combine and deduplicate results
    const vectorResults: SearchResult[] = (vectorMatches || []).map(match => ({
      ...match,
      source: 'vector',
      score: match.similarity
    }));

    const textResults: SearchResult[] = (textMatches || []).map(match => ({
      ...match,
      similarity: 0.5,
      source: 'text',
      score: 0.5
    }));

    // Combine all results
    const allResults: SearchResult[] = [...vectorResults, ...textResults];
    
    // Remove duplicates and sort by score
    const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
    
    const results = uniqueResults
      .filter(match => match.content?.trim())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(match => ({
        id: match.id,
        content: match.content.trim(),
        title: match.title?.trim() || 'Untitled',
        category: match.category?.trim() || 'General',
        similarity: match.score
      }));

    console.log('Final combined results:', results.length);
    if (results.length > 0) {
      console.log('Top match source:', (uniqueResults[0] as SearchResult).source);
      console.log('Top match title:', results[0].title);
    }

    return results;

  } catch (error) {
    console.error('Error in hybrid search:', error);
    return [];
  }
}

const buildPrompt = async (history: string, context: DocumentResult[], message: string) => {
  const formattedContext = context
    .map(doc => `[${doc.category}] ${doc.title}
${doc.content}`)
    .join('\n\n');
  console.log('Found context:', formattedContext);

  const prompt = `You are a helpful customer support agent. Try your best to answer the user's question using the context and conversation history provided below.

    Conversation History:
    ${history}

    Available Knowledge:
    ${formattedContext || 'No relevant documentation found. I will try to help based on general knowledge.'}

    User Message:
    ${message}

    Instructions:
    1. Use the provided context if relevant
    2. If no context matches, acknowledge it and help based on general knowledge
    3. Keep responses concise and focused
    4. Try to recommend products
    5. If unsure, ask for clarification
    6. Keep responses short and concise
    `;

  return prompt;
}

const sendMessage = async (conversation_id: string, message: string) => {
  const { data, error } = await supabase.from('messages').insert({ conversation_id, content: message, sender_type: 'ai' });
  return data;
}

const processMessage = async (payload: WebhookPayload) => {
  try {
    const config = { configurable: { thread_id: payload.record.conversation_id } };
    
    // Get conversation history
    const messages = await getMessages(payload.record.conversation_id);
    if (!messages || messages.length === 0) {
      console.warn('No message history found for conversation:', payload.record.conversation_id);
    }

    // Get last 5 customer messages for context
    const customerMessages = messages
      .filter(message => message.role === 'user')
      .slice(0, 5)
      .map(message => message.content)
      .join(' ');

    console.log('Creating embedding for messages:', customerMessages);
    const messageEmbedding = await createEmbedding(customerMessages);
    console.log('Embedding created with length:', messageEmbedding.length);

    // Search using both vector and text search
    const contextDocuments = await searchDocuments(messageEmbedding, customerMessages);
    console.log('Found context documents:', contextDocuments.length);
    
    // Build and execute prompt
    const prompt = await buildPrompt(
      JSON.stringify(messages || []), 
      contextDocuments,
      payload.record.content
    );
    
    const output = await app.invoke({ messages: prompt }, config);
    const lastMessageContent = output.messages[output.messages.length - 1].content as string;
    
    // Send response
    await sendMessage(payload.record.conversation_id, lastMessageContent);
    return lastMessageContent;
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
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