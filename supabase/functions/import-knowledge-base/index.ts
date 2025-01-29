import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { Client } from "langsmith"
import { traceable } from "langsmith/traceable"
import { OpenAI } from "openai"
import {
  ImportRequest,
  ImportResponse,
  DocumentMetadata,
  ProcessedDocument,
  JsonDocument,
  ErrorType,
  ProcessingError
} from './types.ts';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!,
});

// Initialize LangSmith client
const client = new Client({
  apiKey: Deno.env.get("LANGCHAIN_API_KEY")!,
});

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    }
  }
)

// Error handling class
class KnowledgeBaseError extends Error implements ProcessingError {
  type: ErrorType;
  details?: unknown;

  constructor(message: string, type: ErrorType, details?: unknown) {
    super(message);
    this.name = 'KnowledgeBaseError';
    this.type = type;
    this.details = details;
  }
}

// Helper function for structured error logging
function logError(error: ProcessingError | Error | unknown, context: string) {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    context,
    type: error instanceof KnowledgeBaseError ? error.type : ErrorType.UNKNOWN,
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    details: error instanceof KnowledgeBaseError ? error.details : error
  };

  console.error('Error occurred:', JSON.stringify(errorDetails, null, 2));
  return errorDetails;
}

// Helper function to validate JSON document with enhanced error handling
function validateJsonDocument(doc: unknown): JsonDocument {
  try {
    if (!doc || typeof doc !== 'object') {
      throw new KnowledgeBaseError(
        'Invalid document format: expected an object',
        ErrorType.VALIDATION,
        { receivedValue: doc }
      );
    }
    
    const d = doc as Partial<JsonDocument>;
    const validationErrors: string[] = [];

    // Validate required fields
    if (!d.url || typeof d.url !== 'string') {
      validationErrors.push('url must be a string');
    }
    if (!d.markdown || typeof d.markdown !== 'string') {
      validationErrors.push('markdown must be a string');
    }
    if (!d.metadata || typeof d.metadata !== 'object') {
      validationErrors.push('metadata must be an object');
    } else {
      // Validate metadata fields
      const m = d.metadata;
      if (!m.canonicalUrl || typeof m.canonicalUrl !== 'string') {
        validationErrors.push('metadata.canonicalUrl must be a string');
      }
      if (!m.title || typeof m.title !== 'string') {
        validationErrors.push('metadata.title must be a string');
      }
      
      // Optional fields type checking
      if (m.description !== undefined && typeof m.description !== 'string' && m.description !== null) {
        validationErrors.push('metadata.description must be a string or null if present');
      }
      if (m.author !== undefined && typeof m.author !== 'string' && m.author !== null) {
        validationErrors.push('metadata.author must be a string or null if present');
      }
      if (m.keywords !== undefined && typeof m.keywords !== 'string' && m.keywords !== null) {
        validationErrors.push('metadata.keywords must be a string or null if present');
      }
      if (m.openGraph !== undefined && !Array.isArray(m.openGraph)) {
        validationErrors.push('metadata.openGraph must be an array if present');
      }
    }

    if (validationErrors.length > 0) {
      throw new KnowledgeBaseError(
        'Document validation failed',
        ErrorType.VALIDATION,
        { 
          validationErrors,
          document: {
            url: d.url,
            title: d.metadata?.title,
            contentPreview: d.markdown ? d.markdown.slice(0, 100) : undefined
          }
        }
      );
    }

    // Ensure all required fields are present
    if (!d.url || !d.markdown || !d.metadata || !d.metadata.canonicalUrl || !d.metadata.title) {
      throw new KnowledgeBaseError(
        'Document validation failed: missing required fields',
        ErrorType.VALIDATION,
        { document: d }
      );
    }

    // Set content from markdown if not provided
    const validatedDoc: JsonDocument = {
      url: d.url,
      markdown: d.markdown,
      content: d.content || d.markdown,
      metadata: d.metadata
    };

    return validatedDoc;
  } catch (error) {
    if (error instanceof KnowledgeBaseError) {
      throw error;
    }
    throw new KnowledgeBaseError(
      'Document validation failed',
      ErrorType.VALIDATION,
      { originalError: error }
    );
  }
}

// Helper function to fetch and validate JSON from URL with enhanced error handling
async function fetchDocuments(url: string): Promise<JsonDocument[]> {
  try {
    console.log('Fetching documents from URL:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new KnowledgeBaseError(
        `Failed to fetch documents: ${response.statusText}`,
        ErrorType.FETCH,
        { 
          status: response.status, 
          statusText: response.statusText,
          url 
        }
      );
    }

    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    let text: string;
    try {
      text = await response.text(); // First get the raw text
      console.log('Response body length:', text.length);
      console.log('Response body preview:', text.slice(0, 200));
    } catch (error) {
      throw new KnowledgeBaseError(
        'Failed to read response body',
        ErrorType.FETCH,
        { originalError: error }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
      console.log('Parsed JSON type:', Array.isArray(data) ? 'array' : typeof data);
      console.log('Number of items:', Array.isArray(data) ? data.length : 'not an array');
    } catch (error) {
      throw new KnowledgeBaseError(
        'Failed to parse JSON response',
        ErrorType.FETCH,
        { 
          originalError: error,
          responseText: text.slice(0, 1000),
          url
        }
      );
    }

    if (!Array.isArray(data)) {
      throw new KnowledgeBaseError(
        'Invalid JSON format: expected an array of documents',
        ErrorType.VALIDATION,
        { 
          receivedType: typeof data,
          sample: JSON.stringify(data).slice(0, 1000),
          url
        }
      );
    }

    const validDocuments: JsonDocument[] = [];
    const invalidDocuments: { index: number; errors: unknown; sample?: unknown }[] = [];

    for (let i = 0; i < data.length; i++) {
      const doc = data[i];
      try {
        // For Apify dataset, construct the document in the expected format
        const processedDoc = {
          url: doc.url || '',
          markdown: doc.markdown || doc.content || '',
          content: doc.content || doc.markdown || '',
          metadata: {
            canonicalUrl: doc.url || '',
            title: doc.title || '',
            status: 'active',
            description: doc.description || null,
            author: doc.author || null,
            keywords: doc.keywords || null,
            headers: doc.headers || {},
            openGraph: doc.openGraph || []
          }
        };

        const validatedDoc = validateJsonDocument(processedDoc);
        validDocuments.push(validatedDoc);
      } catch (error) {
        console.warn('Invalid document at index', i, error);
        invalidDocuments.push({ 
          index: i, 
          errors: error,
          sample: JSON.stringify(doc).slice(0, 200)
        });
      }
    }

    if (validDocuments.length === 0) {
      throw new KnowledgeBaseError(
        'No valid documents found in the JSON data',
        ErrorType.VALIDATION,
        { 
          invalidDocuments,
          totalDocuments: data.length,
          sample: JSON.stringify(data[0]).slice(0, 1000),
          url
        }
      );
    }

    console.log('Successfully processed documents:', {
      total: data.length,
      valid: validDocuments.length,
      invalid: invalidDocuments.length
    });

    if (invalidDocuments.length > 0) {
      console.warn('Some documents were invalid and will be skipped:', {
        validCount: validDocuments.length,
        invalidCount: invalidDocuments.length,
        firstInvalidDocument: invalidDocuments[0]
      });
    }

    return validDocuments;
  } catch (error) {
    if (error instanceof KnowledgeBaseError) {
      throw error;
    }
    throw new KnowledgeBaseError(
      'Failed to fetch or process documents',
      ErrorType.UNKNOWN,
      { originalError: error, url }
    );
  }
}

// Helper function to generate embeddings with enhanced error handling
const generateEmbedding = traceable(
  async (content: string, metadata: DocumentMetadata): Promise<number[]> => {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content
      });

      return response.data[0].embedding;
    } catch (error) {
      throw new KnowledgeBaseError(
        'Failed to generate embedding',
        ErrorType.AI,
        { originalError: error, metadata }
      );
    }
  },
  {
    name: 'embedding_generation',
    tags: ['openai', 'embedding']
  }
);

// Helper function to generate categories with LangSmith tracking
const generateCategories = traceable(
  async (content: string): Promise<string[]> => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a document categorization expert. Generate up to 5 relevant categories for the given content. Return only the categories as a comma-separated list."
        },
        {
          role: "user",
          content
        }
      ],
      temperature: 0.3,
    });

    const categories = response.choices[0].message.content?.split(',').map(c => c.trim()) || [];
    return categories;
  },
  {
    name: 'category_generation',
    tags: ['openai', 'categorization']
  }
);

// Helper function to extract keywords with LangSmith tracking
const extractKeywords = traceable(
  async (content: string): Promise<string[]> => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a keyword extraction expert. Extract up to 10 relevant keywords or key phrases from the given content. Return only the keywords as a comma-separated list."
        },
        {
          role: "user",
          content
        }
      ],
      temperature: 0.3,
    });

    const keywords = response.choices[0].message.content?.split(',').map(k => k.trim()) || [];
    return keywords;
  },
  {
    name: 'keyword_extraction',
    tags: ['openai', 'keywords']
  }
);

// Helper function to process a single document with error handling
const processDocument = traceable(
  async (content: string, metadata: DocumentMetadata): Promise<ProcessedDocument | null> => {
    try {
      const [embedding, categories, keywords] = await Promise.all([
        generateEmbedding(content, metadata),
        generateCategories(content),
        extractKeywords(content)
      ]);

      return {
        content,
        metadata,
        embedding,
        categories,
        keywords
      };
    } catch (error) {
      console.error('Error processing document:', error);
      return null;
    }
  },
  {
    name: 'document_processing',
    tags: ['processing']
  }
);

// Helper function to insert processed document with enhanced error handling
async function insertDocument(doc: ProcessedDocument, accountId: string): Promise<boolean> {
  try {
    const { error } = await supabaseClient.from('documents').insert({
      title: doc.metadata.title,
      account_id: accountId,
      content: doc.content,
      metadata: doc.metadata,
      embedding: doc.embedding,
      ai_metadata: {
        categories: doc.categories,
        keywords: doc.keywords
      }
    });

    if (error) {
      throw new KnowledgeBaseError(
        'Failed to insert document',
        ErrorType.DATABASE,
        { supabaseError: error, documentMetadata: doc.metadata }
      );
    }

    return true;
  } catch (error) {
    logError(error, 'insertDocument');
    return false;
  }
}

// Main processing function with enhanced error handling
const processDocuments = traceable(
  async (documents: JsonDocument[], accountId: string): Promise<number> => {
    let successCount = 0;
    const errors: { document: DocumentMetadata; error: unknown }[] = [];

    for (const doc of documents) {
      try {
        const processed = await processDocument(doc.content, doc.metadata);
        if (processed) {
          const inserted = await insertDocument(processed, accountId);
          if (inserted) {
            successCount++;
          } else {
            errors.push({
              document: doc.metadata,
              error: new KnowledgeBaseError(
                'Failed to insert document',
                ErrorType.DATABASE
              )
            });
          }
        }
      } catch (error) {
        errors.push({ document: doc.metadata, error });
      }
    }

    if (errors.length > 0) {
      logError(
        new KnowledgeBaseError(
          'Some documents failed to process',
          ErrorType.PROCESSING,
          { errors }
        ),
        'processDocuments'
      );
    }

    return successCount;
  },
  {
    name: 'batch_processing',
    tags: ['processing']
  }
);

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200
    });
  }

  try {
    // Log request details for debugging
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Clone the request for debugging (since body can only be read once)
    const reqClone = req.clone();
    const rawBody = await reqClone.text();
    console.log('Raw request body:', rawBody);

    // Validate request method
    if (req.method !== 'POST') {
      throw new KnowledgeBaseError(
        'Only POST requests are supported',
        ErrorType.VALIDATION,
        { receivedMethod: req.method }
      );
    }

    // Validate request content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new KnowledgeBaseError(
        'Content-Type must be application/json',
        ErrorType.VALIDATION,
        { 
          receivedContentType: contentType,
          rawBody
        }
      );
    }

    // Get request body text
    let bodyText: string;
    try {
      bodyText = await req.text();
      console.log('Request body length:', bodyText.length);
      console.log('Request body preview:', bodyText.slice(0, 200));
    } catch (error) {
      throw new KnowledgeBaseError(
        'Failed to read request body',
        ErrorType.VALIDATION,
        { 
          originalError: error,
          rawBody 
        }
      );
    }

    // Check for empty body
    if (!bodyText || bodyText.trim().length === 0) {
      throw new KnowledgeBaseError(
        'Request body is empty. Expected JSON object with documents and accountId fields',
        ErrorType.VALIDATION,
        { 
          help: 'Make sure you are sending a POST request with a JSON body containing documents array and accountId fields',
          example: {
            documents: [{ url: '...', content: '...', metadata: { /* ... */ } }],
            accountId: 'your-account-id'
          },
          rawBody,
          headers: Object.fromEntries(req.headers.entries())
        }
      );
    }

    // Parse JSON with better error handling
    let body: unknown;
    try {
      body = JSON.parse(bodyText);
      console.log('Parsed request body type:', typeof body);
    } catch (error) {
      throw new KnowledgeBaseError(
        'Invalid JSON in request body',
        ErrorType.VALIDATION,
        { 
          originalError: error,
          bodyPreview: bodyText.slice(0, 1000),
          bodyLength: bodyText.length
        }
      );
    }

    // Type check the parsed body
    if (!body || typeof body !== 'object') {
      throw new KnowledgeBaseError(
        'Request body must be an object',
        ErrorType.VALIDATION,
        { receivedType: typeof body }
      );
    }

    const parsedBody = body as Record<string, unknown>;
    const { documents, accountId } = parsedBody;

    // Validate required fields
    if (!Array.isArray(documents)) {
      throw new KnowledgeBaseError(
        'documents field must be an array',
        ErrorType.VALIDATION,
        { receivedType: typeof documents }
      );
    }

    if (!accountId || typeof accountId !== 'string') {
      throw new KnowledgeBaseError(
        'accountId field must be a string',
        ErrorType.VALIDATION,
        { receivedAccountId: accountId }
      );
    }

    const handleImport = traceable(
      async () => {
        // Validate each document
        const validDocuments: JsonDocument[] = [];
        const invalidDocuments: { index: number; errors: unknown }[] = [];

        for (let i = 0; i < documents.length; i++) {
          try {
            const validatedDoc = validateJsonDocument(documents[i]);
            validDocuments.push(validatedDoc);
          } catch (error) {
            invalidDocuments.push({ index: i, errors: error });
          }
        }

        if (validDocuments.length === 0) {
          throw new KnowledgeBaseError(
            'No valid documents found in the request',
            ErrorType.VALIDATION,
            { invalidDocuments }
          );
        }

        // Start processing in the background
        processDocuments(validDocuments, accountId).catch(error => {
          logError(error, 'backgroundProcessing');
        });

        // Initial response to acknowledge request
        const response: ImportResponse = {
          success: true,
          message: `Import process started. Processing ${validDocuments.length} documents.`,
          documentCount: validDocuments.length,
          skippedCount: 0
        };

        return new Response(
          JSON.stringify(response),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
            status: 200,
          },
        );
      },
      {
        name: 'knowledge_base_import',
        tags: ['import', accountId]
      }
    );

    return handleImport();
  } catch (error) {
    const errorDetails = logError(error, 'requestHandler');
    
    const response: ImportResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error instanceof KnowledgeBaseError ? error.type : ErrorType.UNKNOWN,
      details: error instanceof KnowledgeBaseError ? error.details : undefined,
      documentCount: 0,
      skippedCount: 0
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error instanceof KnowledgeBaseError && error.type === ErrorType.VALIDATION ? 400 : 500,
      },
    );
  }
}); 
