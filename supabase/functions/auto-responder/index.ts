// Add Deno types
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts';
import { ChatOpenAI } from "@langchain/openai";
import { 
  ChatPromptTemplate, 
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate
} from "@langchain/core/prompts";
import { 
  JsonOutputParser,
  StringOutputParser 
} from "@langchain/core/output_parsers";
import { Client as LangSmith } from "langsmith";
import { createClient } from '@supabase/supabase-js'
import { MemorySaver } from "@langchain/langgraph-checkpoint";


// State types
type ConversationState = 'COLLECTING' | 'VERIFYING' | 'HANDOFF';

interface ExtractedInfo {
  email?: { value: string; confidence: number };
  companyName?: { value: string; confidence: number };
  firstName?: { value: string; confidence: number };
  lastName?: { value: string; confidence: number };
  domain?: { value: string; confidence: number };
}

interface ConversationContext {
  state: ConversationState;
  attempts: number;
  extracted_info: ExtractedInfo;
  lastMessageId: string;
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

interface TicketClassification {
  issue_type: string;
  confidence: number;
  summary: string;
}

// State types for customer creation
type CustomerCreationState = 'COLLECTING_INFO' | 'VERIFYING_INFO' | 'CREATING_COMPANY' | 'CREATING_CUSTOMER' | 'COMPLETED' | 'ERROR';

interface CustomerInfo {
  email?: { value: string; confidence: number };
  companyName?: { value: string; confidence: number };
  firstName?: { value: string; confidence: number };
  lastName?: { value: string; confidence: number };
  domain?: { value: string; confidence: number };
}

interface CustomerCreationContext {
  state: CustomerCreationState;
  info: CustomerInfo;
  attempts: number;
  lastError?: string;
  accountId?: string;
  companyId?: string;
  customerId?: string;
}

interface CustomerCreationResult {
  success: boolean;
  error?: string;
  customerId?: string;
}

// Initialize clients
const model = new ChatOpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
  modelName: "gpt-4-turbo-preview",
  temperature: 0
});

const stringParser = new StringOutputParser();
const jsonParser = new JsonOutputParser();

// Initialize memory with proper configuration
const memory = new MemorySaver();

// Create base prompt templates
const extractionPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`You are a JSON extraction assistant. Extract the following information from the message if present and return it in JSON format:
- Email address (must be valid format)
- Company name
- First name
- Last name
- Domain name

The response must be in this exact JSON format:
{
  "email": { "value": "string", "confidence": number },
  "companyName": { "value": "string", "confidence": number },
  "firstName": { "value": "string", "confidence": number },
  "lastName": { "value": "string", "confidence": number },
  "domain": { "value": "string", "confidence": number }
}

Only include fields if they are present in the text. Confidence should be between 0 and 1.
For email addresses, only return if confidence > 0.9 and format is valid.
For company names, only return if confidence > 0.8.`),
  HumanMessagePromptTemplate.fromTemplate("Please extract information from: {input}")
]);

const intentPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`You are a JSON intent classifier. Analyze if the message contains a purchase intent and classify the type.
Your response must be in this exact JSON format:
{
  "hasPurchaseIntent": boolean,
  "intentType": "information" | "purchase",
  "products": string[]
}`),
  HumanMessagePromptTemplate.fromTemplate("Please analyze this message and return as JSON: {input}")
]);

const responsePrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`You are a helpful customer service AI assistant. Keep responses concise and action-oriented.

Current State: {state}
Guidelines:
- Keep responses under 2 sentences when possible
- Focus on providing product information and collecting contact details
- DO NOT handle orders or collect shipping/payment information
- Hand off to sales team for purchase requests
- Only ask for email address, no other personal information needed
- Provide product information freely without requiring contact details

Previous messages:
{chat_history}`),
  HumanMessagePromptTemplate.fromTemplate("{input}")
]);

const ticketClassificationPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`You are a JSON ticket classifier. Analyze the following message and conversation context to:
1. Determine the primary issue type from these categories: technical_issue, billing_question, feature_request, bug_report, account_access, program_logistics, or other
2. Provide a confidence score between 0 and 1
3. Write a one-line summary of the issue

Your response must be in this exact JSON format:
{
  "issue_type": "category_name",
  "confidence": 0.XX,
  "summary": "Brief description"
}`),
  HumanMessagePromptTemplate.fromTemplate("Please classify this ticket and return as JSON: Message: {message}\n\nContext: {context}")
]);

const langsmith = new LangSmith({
  apiUrl: Deno.env.get('LANGSMITH_ENDPOINT') || "https://api.smith.langchain.com",
  apiKey: Deno.env.get('LANGSMITH_API_KEY'),
});

const projectName = Deno.env.get('LANGSMITH_PROJECT') || "default";

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Remove old interfaces and helper functions
interface LLMResponse<T> {
  content: T;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface RunUpdate {
  outputs?: Record<string, any>;
  error?: string;
  end_time?: number;
  metrics?: Record<string, number>;
}

interface RunContext {
  parentRunId?: string;
  runId?: string;
}

async function withLangsmithTracking<T>(
  name: string,
  inputs: Record<string, unknown>,
  operation: (ctx: RunContext) => Promise<T>,
  context: RunContext = {}
): Promise<T> {
  const runId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    await langsmith.createRun({
      name,
      id: runId,
      run_type: "chain",
      inputs: { data: inputs },
      start_time: startTime,
      parent_run_id: context.parentRunId,
      project_name: projectName,
      extra: {
        metadata: {
          source: "auto-responder",
          timestamp: new Date().toISOString()
        }
      }
    });

    const result = await operation({ 
      parentRunId: runId,
      runId 
    });
    
    const endTime = Date.now();

    const update: RunUpdate = {
      outputs: { result: typeof result === 'string' ? result : JSON.stringify(result) },
      end_time: endTime,
      metrics: {
        response_time_ms: endTime - startTime
      }
    };

    await langsmith.updateRun(runId, update);

    return result;
  } catch (error) {
    const endTime = Date.now();
    const errorUpdate: RunUpdate = {
      error: error instanceof Error ? error.message : String(error),
      end_time: endTime,
      metrics: {
        response_time_ms: endTime - startTime
      }
    };
    await langsmith.updateRun(runId, errorUpdate);
    throw error;
  }
}

// State management
async function getConversationState(conversationId: string): Promise<ConversationContext> {
  const { data, error } = await supabaseClient
    .from('conversation_states')
    .select('*')
    .eq('conversation_id', conversationId)
    .single();

  if (error || !data) {
    return {
      state: 'COLLECTING',
      attempts: 0,
      extracted_info: {},
      lastMessageId: ''
    };
  }

  return data as ConversationContext;
}

async function updateConversationState(
  conversationId: string,
  context: Partial<ConversationContext>
): Promise<void> {
  try {
    console.log('Updating conversation state:', {
      conversationId,
      context,
      timestamp: new Date().toISOString()
    });

    const { error } = await supabaseClient
      .from('conversation_states')
      .upsert({
        conversation_id: conversationId,
        ...context,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to update conversation state: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in conversation state update:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: context,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Essential monitoring
async function logEvent(
  conversationId: string,
  eventType: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    console.log('Logging event:', {
      conversationId,
      eventType,
      details,
      timestamp: new Date().toISOString()
    });

    // Create run without LLM tracking
    const runId = crypto.randomUUID();
    await langsmith.createRun({
      name: eventType,
      id: runId,
      run_type: "chain",
      inputs: details,
      start_time: Date.now(),
      project_name: projectName,
      extra: {
        metadata: {
          source: "auto-responder",
          event_type: eventType,
          conversation_id: conversationId,
          timestamp: new Date().toISOString()
        }
      }
    });

    const { error } = await supabaseClient
      .from('conversation_events')
      .insert({
        conversation_id: conversationId,
        event_type: eventType,
        details,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to insert event: ${error.message}`);
    }

    await langsmith.updateRun(runId, {
      outputs: { success: !error },
      end_time: Date.now()
    });

  } catch (error) {
    console.error('Error in event logging:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      details,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// Update extractInformation to use direct model call
async function extractInformation(content: string, context: RunContext = {}): Promise<ExtractedInfo> {
  return withLangsmithTracking(
    "extract_information", 
    { content }, 
    async (ctx) => {
      const response = await model.predict(content);
      return jsonParser.invoke(response) as Promise<ExtractedInfo>;
    },
    context
  );
}

// Update detectPurchaseIntent to use direct model call
async function detectPurchaseIntent(
  content: string, 
  context: RunContext = {}
): Promise<{
  hasPurchaseIntent: boolean;
  intentType?: 'information' | 'purchase';
  products?: string[];
}> {
  return withLangsmithTracking(
    "detect_purchase_intent",
    { content },
    async (ctx) => {
      const response = await model.predict(content);
      return jsonParser.invoke(response) as Promise<{
        hasPurchaseIntent: boolean;
        intentType?: 'information' | 'purchase';
        products?: string[];
      }>;
    },
    context
  );
}

// Update generateResponse to use direct model call
async function generateResponse(
  content: string,
  state: ConversationContext,
  extractedInfo: ExtractedInfo,
  conversationHistory: Array<{ content: string; sender_type: string }>,
  context: RunContext = {}
): Promise<string> {
  return withLangsmithTracking(
    "generate_response",
    { content, state, extractedInfo, conversationHistory },
    async (ctx) => {
      const formattedHistory = conversationHistory
        .map(msg => `${msg.sender_type}: ${msg.content}`)
        .join('\n');
      
      const prompt = `Current State: ${state.state}\n\nChat History:\n${formattedHistory}\n\nUser: ${content}`;
      const response = await model.predict(prompt);
      return stringParser.invoke(response);
    },
    context
  );
}

// Update classifyTicket to use direct model call
async function classifyTicket(content: string, conversationContext: any): Promise<TicketClassification> {
  const prompt = `Message: ${content}\nContext: ${JSON.stringify(conversationContext)}`;
  const response = await model.predict(prompt);
  return jsonParser.invoke(response) as Promise<TicketClassification>;
}

// Add this function to get conversation history
async function getConversationHistory(conversationId: string): Promise<Array<{ content: string; sender_type: string }>> {
  const { data, error } = await supabaseClient
    .from('messages')
    .select('content, sender_type')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }

  return data || [];
}

async function verifyCustomerExists(email: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('customers')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Error verifying customer:', error);
    return false;
  }

  return data !== null;
}

// Add enhanced logging function
async function logError(context: string, error: any, details?: any): Promise<void> {
  console.error(`Error in ${context}:`, {
    message: error.message,
    details: details || error,
    timestamp: new Date().toISOString(),
    stack: error.stack
  });
}

// Update createNewCustomer function to match new-contact implementation
async function createNewCustomer(
  email: string,
  companyName: string,
  conversationId: string,
  firstName?: string,
  lastName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Creating new customer:', { email, companyName, firstName, lastName });

    // Get the conversation's account_id first
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('account_id')
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      await logError('conversation lookup', conversationError);
      throw new Error(`Conversation lookup failed: ${conversationError.message}`);
    }

    if (!conversation?.account_id) {
      throw new Error('No account_id found for conversation');
    }

    // Create or get company first
    const { data: company, error: companyError } = await supabaseClient
      .from('customer_companies')
      .select('id, account_id')
      .eq('name', companyName)
      .eq('account_id', conversation.account_id)
      .maybeSingle();

    if (companyError) {
      await logError('company lookup', companyError);
      throw new Error(`Company lookup failed: ${companyError.message}`);
    }

    let companyId = company?.id;

    if (!companyId) {
      console.log('Creating new company:', companyName);
      const { data: newCompany, error: createError } = await supabaseClient
        .from('customer_companies')
        .insert({ 
          name: companyName,
          account_id: conversation.account_id
        })
        .select('id, account_id')
        .single();

      if (createError) {
        await logError('company creation', createError);
        throw new Error(`Company creation failed: ${createError.message}`);
      }
      companyId = newCompany.id;
    }

    // Check if customer already exists
    const { data: existingCustomer, error: existingError } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      await logError('existing customer check', existingError);
    } else if (existingCustomer) {
      console.log('Customer already exists:', email);
      return { success: true }; // Customer exists, consider it a success
    }

    // Create new customer in public.customers table
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .insert({
        email,
        first_name: firstName || email.split('@')[0],
        last_name: lastName || '',
        customer_company_id: companyId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (customerError) {
      await logError('customer creation', customerError);
      throw new Error(`Customer creation failed: ${customerError.message}`);
    }

    console.log('Customer created successfully:', {
      email,
      companyId,
      customerId: customer.id
    });

    return { success: true };
  } catch (error) {
    await logError('createNewCustomer', error);
    return { success: false, error: error.message };
  }
}

// Update handleHandoff function with better logging
async function handleHandoff(
  conversationId: string,
  email: string,
  reason: 'sentiment' | 'existing_customer' | 'max_attempts'
): Promise<void> {
  try {
    console.log('Initiating handoff:', {
      conversationId,
      email,
      reason,
      timestamp: new Date().toISOString()
    });

    // Create a ticket for human follow-up
    const { error: ticketError } = await supabaseClient
      .from('tickets')
      .insert({
        conversation_id: conversationId,
        status: 'pending_assignment',
        priority: reason === 'sentiment' ? 'high' : 'normal',
        customer_email: email,
        handoff_reason: reason
      });

    if (ticketError) {
      await logError('ticket creation', ticketError);
    }

    // Log the handoff event
    await logEvent(conversationId, 'handoff_initiated', {
      reason,
      email,
      timestamp: new Date().toISOString()
    });

    console.log('Handoff completed:', {
      conversationId,
      email,
      reason
    });
  } catch (error) {
    await logError('handleHandoff', error);
    throw error;
  }
}

// Add after handleHandoff function

interface MetricsData {
  extraction_accuracy: number;
  handoff_success_rate: number;
  avg_response_time: number;
  sentiment_scores: number[];
}

async function trackMetrics(
  conversationId: string,
  metricType: 'extraction' | 'handoff' | 'response_time' | 'sentiment',
  value: number
): Promise<void> {
  await logEvent(conversationId, `metric_${metricType}`, {
    value,
    timestamp: new Date().toISOString()
  });
}

async function calculateExtractionAccuracy(extractedInfo: ExtractedInfo): Promise<number> {
  let totalFields = 0;
  let highConfidenceFields = 0;

  if (extractedInfo.email) {
    totalFields++;
    if (extractedInfo.email.confidence >= 0.9) highConfidenceFields++;
  }
  if (extractedInfo.companyName) {
    totalFields++;
    if (extractedInfo.companyName.confidence >= 0.8) highConfidenceFields++;
  }
  if (extractedInfo.firstName) {
    totalFields++;
    if (extractedInfo.firstName.confidence >= 0.8) highConfidenceFields++;
  }
  if (extractedInfo.lastName) {
    totalFields++;
    if (extractedInfo.lastName.confidence >= 0.8) highConfidenceFields++;
  }
  if (extractedInfo.domain) {
    totalFields++;
    if (extractedInfo.domain.confidence >= 0.8) highConfidenceFields++;
  }

  return totalFields > 0 ? highConfidenceFields / totalFields : 0;
}

// Add memory persistence functions
async function loadMemoryFromSupabase(conversationId: string): Promise<void> {
  try {
    const { data, error } = await supabaseClient
      .from('messages')
      .select('content, sender_type')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading memory:', error);
      return;
    }

    // Clear existing memory
    await memory.clear();

    // Reconstruct chat history
    for (const message of data || []) {
      await memory.saveContext(
        { input: message.sender_type === 'customer' ? message.content : '' },
        { output: message.sender_type === 'ai' ? message.content : '' }
      );
    }
  } catch (error) {
    console.error('Error in loadMemoryFromSupabase:', error);
  }
}

// Update processMessage to use the new context pattern
async function processMessage(payload: WebhookPayload): Promise<void> {
  const startTime = Date.now();
  const { record } = payload;
  const conversationId = record.conversation_id;
  const runContext: RunContext = { runId: crypto.randomUUID() };
  
  try {
    // Load conversation context and memory
    const context = await getConversationState(conversationId);
    await loadMemoryFromSupabase(conversationId);
    
    // Get memory variables for context
    const memoryVariables = await memory.loadMemoryVariables({});
    const conversationHistory = memoryVariables.chat_history || [];
    
    // Extract information and detect intent with context
    const extractedInfo = await extractInformation(record.content, runContext);
    const purchaseIntent = await detectPurchaseIntent(record.content, runContext);
    
    // Track extraction accuracy
    const accuracy = await calculateExtractionAccuracy(extractedInfo);
    await trackMetrics(conversationId, 'extraction', accuracy);
    
    // Initialize customer creation agent with injected supabaseClient
    const customerAgent = new CustomerCreationAgent(supabaseClient, extractedInfo);
    
    // Process customer creation if we have purchase intent and required info
    if (purchaseIntent.hasPurchaseIntent && 
        purchaseIntent.intentType === 'purchase' && 
        extractedInfo.email?.value &&
        extractedInfo.email?.confidence !== undefined &&
        extractedInfo.email.confidence >= 0.9 && 
        extractedInfo.companyName?.value &&
        extractedInfo.companyName?.confidence !== undefined &&
        extractedInfo.companyName.confidence >= 0.8) {
      
      const result = await customerAgent.process();
      
      if (result.success) {
        await handleHandoff(
          conversationId,
          extractedInfo.email.value,
          'existing_customer'
        );
        await trackMetrics(conversationId, 'handoff', 1);
      } else {
        console.error('Customer creation failed:', result.error);
        await trackMetrics(conversationId, 'handoff', 0);
      }
    }

    // Generate response based on agent state and conversation history
    const agentState = customerAgent.getState();
    let response: string;

    switch (agentState.state) {
      case 'COLLECTING_INFO':
        if (!extractedInfo.email?.value || 
            extractedInfo.email?.confidence === undefined || 
            extractedInfo.email.confidence < 0.9) {
          response = await generateResponse(
            record.content,
            context,
            extractedInfo,
            conversationHistory,
            runContext
          );
        } else if (!extractedInfo.companyName?.value || 
                   extractedInfo.companyName?.confidence === undefined || 
                   extractedInfo.companyName.confidence < 0.8) {
          response = "Could you please let me know which company you're representing?";
        } else {
          response = await generateResponse(
            record.content,
            context,
            extractedInfo,
            conversationHistory,
            runContext
          );
        }
        break;

      case 'COMPLETED':
        response = `Thank you! I'll have our sales team reach out to you at ${extractedInfo.email?.value} regarding ${
          purchaseIntent.products?.length ? 
          purchaseIntent.products.join(", ") : 
          "our products"
        }. They'll be able to assist you with your order for ${extractedInfo.companyName?.value}.`;
        break;

      case 'ERROR':
        response = "I apologize, but I'm having trouble processing your request. Let me connect you with our support team.";
        await handleHandoff(
          conversationId,
          extractedInfo.email?.value || '',
          'sentiment'
        );
        break;

      default:
        response = await generateResponse(
          record.content,
          context,
          extractedInfo,
          conversationHistory,
          runContext
        );
    }

    // Save the new interaction to memory
    await memory.saveContext(
      { input: record.content },
      { output: response }
    );

    // Insert response to database
    const { error: responseError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: response,
        sender_type: 'ai'
      });

    if (responseError) {
      console.error('Error inserting response:', responseError);
    }

    // Track response time
    const responseTime = Date.now() - startTime;
    await trackMetrics(conversationId, 'response_time', responseTime);

    await logEvent(conversationId, 'state_transition', {
      state: agentState.state,
      info: agentState.info,
      metrics: {
        extraction_accuracy: accuracy,
        response_time: responseTime,
        sentiment: record.sentiment_score
      }
    });

  } catch (error) {
    await logError('processMessage', error);
    throw error;
  }
}

class CustomerCreationAgent {
  private context: CustomerCreationContext;

  constructor(
    private supabaseClient: any,
    initialInfo: CustomerInfo = {}
  ) {
    this.context = {
      state: 'COLLECTING_INFO',
      info: initialInfo,
      attempts: 0
    };
  }

  private async transition(newState: CustomerCreationState, updates: Partial<CustomerCreationContext> = {}) {
    this.context = {
      ...this.context,
      state: newState,
      ...updates
    };
    await this.logStateTransition(newState);
  }

  private async logStateTransition(newState: CustomerCreationState) {
    console.log('Customer creation state transition:', {
      from: this.context.state,
      to: newState,
      info: this.context.info,
      timestamp: new Date().toISOString()
    });
  }

  private hasRequiredInfo(): boolean {
    return !!(
      this.context.info.email?.value &&
      this.context.info.email.confidence >= 0.9 &&
      this.context.info.companyName?.value &&
      this.context.info.companyName.confidence >= 0.8
    );
  }

  public async process(): Promise<CustomerCreationResult> {
    try {
      switch (this.context.state) {
        case 'COLLECTING_INFO':
          if (this.hasRequiredInfo()) {
            await this.transition('VERIFYING_INFO');
            return this.process();
          }
          return { success: false, error: 'Missing required information' };

        case 'VERIFYING_INFO':
          const exists = await this.verifyCustomerExists(this.context.info.email!.value);
          if (exists) {
            await this.transition('COMPLETED', { customerId: 'existing' });
            return { success: true, customerId: 'existing' };
          }
          await this.transition('CREATING_COMPANY');
          return this.process();

        case 'CREATING_COMPANY':
          const companyResult = await this.createOrGetCompany();
          if (!companyResult.success) {
            await this.transition('ERROR', { lastError: companyResult.error });
            return companyResult;
          }
          await this.transition('CREATING_CUSTOMER', { 
            companyId: companyResult.companyId,
            accountId: companyResult.accountId 
          });
          return this.process();

        case 'CREATING_CUSTOMER':
          return await this.createCustomer();

        case 'COMPLETED':
          return { success: true, customerId: this.context.customerId };

        case 'ERROR':
          return { success: false, error: this.context.lastError };

        default:
          return { success: false, error: 'Invalid state' };
      }
    } catch (error) {
      await this.transition('ERROR', { lastError: error.message });
      return { success: false, error: error.message };
    }
  }

  private async verifyCustomerExists(email: string): Promise<boolean> {
    const { data, error } = await this.supabaseClient
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error verifying customer:', error);
      return false;
    }

    return data !== null;
  }

  private async createOrGetCompany(): Promise<{ 
    success: boolean; 
    companyId?: string;
    accountId?: string;
    error?: string 
  }> {
    try {
      // First get or create account based on company domain
      const domain = this.context.info.domain?.value || 
                    this.context.info.email?.value.split('@')[1];
      
      const { data: account, error: accountError } = await this.supabaseClient
        .from('accounts')
        .select('id')
        .eq('domain', domain)
        .single();

      if (accountError && accountError.code !== 'PGRST116') {
        throw new Error(`Account lookup failed: ${accountError.message}`);
      }

      const accountId = account?.id;

      // Then create or get company
      const { data: company, error: companyError } = await this.supabaseClient
        .from('customer_companies')
        .select('id, account_id')
        .eq('name', this.context.info.companyName!.value)
        .eq('account_id', accountId)
        .maybeSingle();

      if (companyError) {
        throw new Error(`Company lookup failed: ${companyError.message}`);
      }

      if (company) {
        return { 
          success: true, 
          companyId: company.id,
          accountId: company.account_id
        };
      }

      // Create new company
      const { data: newCompany, error: createError } = await this.supabaseClient
        .from('customer_companies')
        .insert({ 
          name: this.context.info.companyName!.value,
          account_id: accountId
        })
        .select('id, account_id')
        .single();

      if (createError) {
        throw new Error(`Company creation failed: ${createError.message}`);
      }

      return { 
        success: true, 
        companyId: newCompany.id,
        accountId: newCompany.account_id
      };

    } catch (error) {
      console.error('Error in createOrGetCompany:', error);
      return { success: false, error: error.message };
    }
  }

  private async createCustomer(): Promise<CustomerCreationResult> {
    try {
      if (!this.context.companyId) {
        throw new Error('No company ID available');
      }

      const { data: customer, error: customerError } = await this.supabaseClient
        .from('customers')
        .insert({
          email: this.context.info.email!.value,
          first_name: this.context.info.firstName?.value || this.context.info.email!.value.split('@')[0],
          last_name: this.context.info.lastName?.value || '',
          customer_company_id: this.context.companyId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (customerError) {
        throw new Error(`Customer creation failed: ${customerError.message}`);
      }

      await this.transition('COMPLETED', { customerId: customer.id });
      return { success: true, customerId: customer.id };

    } catch (error) {
      await this.transition('ERROR', { lastError: error.message });
      return { success: false, error: error.message };
    }
  }

  public getState(): CustomerCreationContext {
    return { ...this.context };
  }

  public updateInfo(newInfo: CustomerInfo) {
    this.context.info = {
      ...this.context.info,
      ...newInfo
    };
  }
}

serve(async (req) => {
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