# Knowledge Base Import - Simple MVP Plan

## Overview
Create a simple system to import website content into a searchable knowledge base from a JSON URL.

## Components

### 1. Frontend Implementation ✅
- [x] Single page with URL input (`/pages/knowledge-base/import.tsx`) - Done
- [x] Uses shadcn/ui Input component - Done
- [x] Submit button - Done
- [x] Shows simple success message after submission - Done

### 2. Backend Implementation

#### Import Function (`/supabase/functions/import-knowledge-base`)
```typescript
async function importKnowledgeBase(jsonUrl: string, accountId: string) {
  try {
    // Fetch JSON from URL
    const response = await fetch(jsonUrl);
    const documents = await response.json();
    
    // Process all documents in parallel
    documents.forEach(doc => {
      processDocument(doc, accountId);
    });

    return {
      success: true,
      message: `Started processing ${documents.length} documents. Check back in a few minutes.`
    };
  } catch (error) {
    console.error('Failed to start import:', error);
    return { success: false, error };
  }
}

// Process single document
async function processDocument(doc: WebPageData, accountId: string) {
  try {
    // Generate embedding
    const embedding = await getEmbedding(doc.content);
    
    // Insert into database
    await supabase.from('documents').insert({
      account_id: accountId,
      content: doc.markdown,
      title: doc.metadata.title,
      embedding,
      metadata: doc.metadata,
      ai_metadata: {
        categories: await generateCategories(doc.content),
        keywords: await extractKeywords(doc.content)
      }
    });
  } catch (error) {
    console.error('Failed to process document:', error);
  }
}
```

## Processing Flow
1. User inputs JSON URL and submits
2. Import function:
   - Fetches JSON from URL
   - Returns success message to user
   - Processes all documents in parallel
3. For each document:
   - Generates embedding
   - Creates categories and keywords
   - Saves to database
   - Handles its own errors

## Benefits of This Approach
- Simple URL input instead of file handling
- Maximum parallelization
- Each document processes independently
- Simple error handling per document
- Easy to understand and maintain

## Error Handling
- Each document handles its own errors
- Failed documents don't affect others
- Simple logging per document

## Next Steps
1. Create URL input page
2. Create import function
3. Test with sample URL

## Future Improvements
1. Add progress tracking
2. Add error reporting
3. Add retry mechanism

# Knowledge Base Import - Implementation Checklist

## Phase 1: Frontend Setup 🎨

### 1. Create Route and Page ✅
- [x] Add route in `src/App.tsx`: `/knowledge-base/import` - Done
- [x] Create new page: `src/pages/knowledge-base/ImportPage.tsx` - Done
- [x] Add page to sidebar navigation (similar to Settings page) - Done

### 2. Create Components ✅
- [x] Create `src/components/knowledge-base/import-form.tsx` - Done
  - [x] Use shadcn/ui Input component - Done
  - [x] Add submit button - Done
  - [x] Add loading state - Done
  - [x] Add error state - Done
  - [x] Add success message component - Done
- [x] Style with Tailwind (follow existing patterns) - Done

## Phase 2: Edge Function Setup 🔧

### 1. Create Edge Function ✅
- [x] Create `supabase/functions/import-knowledge-base/index.ts` - Done
- [x] Add OpenAI configuration (similar to other edge functions) - Done
- [x] Add CORS configuration - Done
- [x] Add type definitions - Done
- [x] Set up LangSmith client configuration - Done
- [x] Create LangSmith tracking chains - Done

### 2. Add Helper Functions ✅
- [x] Create embedding function using OpenAI (tracked with LangSmith) - Done
- [x] Create category generation function (tracked with LangSmith) - Done
- [x] Create keyword extraction function (tracked with LangSmith) - Done
- [x] Add error handling utilities - Done
- [x] Create LangSmith chain for document processing flow - Done
- [x] Implement LangSmith run tags for tracking different processing stages - Done

### 3. Add Environment Variables ✅
- [x] Add OpenAI key to Supabase secrets - Done
- [x] Add LANGCHAIN_API_KEY to Supabase secrets - Done
- [x] Add LANGCHAIN_PROJECT name for tracking - Done
- [x] Add LANGCHAIN_ENDPOINT (if using custom endpoint) - Done

### 4. LangSmith Integration ✅
- [x] Create document processing chain - Done
  ```typescript
  // Already implemented in processDocument function with RunTracker
  interface ProcessedDocument {
    content: string;
    metadata: DocumentMetadata;
    embedding: number[];
    categories: string[];
    keywords: string[];
  }
  ```
- [x] Add run metadata collection - Done
  ```typescript
  // Implemented via RunTracker configuration
  const tracker = new RunTracker({
    name: 'document_processing',
    tags: ['processing']
  });
  ```
- [x] Implement chain tracking - Done
  ```typescript
  // Implemented in processDocument function
  return tracker.trackAsync(async () => {
    const [embedding, categories, keywords] = await Promise.all([
      generateEmbedding(content, metadata),
      generateCategories(content),
      extractKeywords(content)
    ]);
  });
  ```
- [x] Add error tracking and reporting - Done
- [x] Implement performance monitoring - Done
- [x] Set up LangSmith dashboards for monitoring - Done

### 5. Processing Flow with LangSmith ✅
- [x] Document intake tracking - Done
  ```typescript
  // Implemented in main request handler
  const tracker = new RunTracker({
    name: 'knowledge_base_import',
    tags: ['import', accountId]
  });
  ```
- [x] Embedding generation tracking - Done
  ```typescript
  // Implemented in generateEmbedding function
  const tracker = new RunTracker({
    name: 'embedding_generation',
    tags: ['openai', 'embedding']
  });
  ```
- [x] AI metadata generation tracking - Done
  ```typescript
  // Implemented in generateCategories and extractKeywords functions
  const tracker = new RunTracker({
    name: 'category_generation',
    tags: ['openai', 'categorization']
  });
  ```

## Phase 3: Document Processing 📝

### 1. Add Core Processing Logic ✅
- [x] Implement URL fetching - Done
- [x] Add JSON validation - Done
- [x] Add document processing function - Done
- [x] Add database insertion logic - Done

### 2. Add Error Handling ✅
- [x] Add try-catch blocks - Done
- [x] Add error logging - Done
- [x] Add error responses - Done
- [x] Test with invalid inputs - Done

### 3. Add Types ✅
- [x] Create types for request/response - Done
  ```typescript
  interface ImportRequest {
    url: string;
    accountId: string;
  }

  interface ImportResponse {
    success: boolean;
    message: string;
    documentCount?: number;
    error?: ErrorType;
    details?: {
      processedCount?: number;
      failedCount?: number;
      errors?: Array<{
        document: string;
        error: string;
      }>;
    };
  }
  ```
- [x] Add types for document processing - Done
  ```typescript
  interface ProcessedDocument {
    content: string;
    metadata: DocumentMetadata;
    embedding: number[];
    categories: string[];
    keywords: string[];
  }
  ```
- [x] Add types for API responses - Done
  ```typescript
  type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: {
      type: ErrorType;
      message: string;
      details?: unknown;
    };
  };
  ```

## Phase 4: Testing and Integration 🧪

### 1. Manual Testing
- [ ] Test with small JSON file (2-3 documents)
- [ ] Test with medium JSON file (10-20 documents)
- [ ] Test with invalid URLs
- [ ] Test with malformed JSON

### 2. Error Cases
- [ ] Test network failures
- [ ] Test OpenAI API failures
- [ ] Test database insertion failures
- [ ] Test with missing fields

### 3. Integration
- [ ] Deploy edge function
- [ ] Test in development
- [ ] Test in production
- [ ] Document any issues or limitations

## Key Implementation Notes 📌

### Frontend Structure
```
src/
  pages/
    knowledge-base/
      ImportPage.tsx
  components/
    knowledge-base/
      import-form.tsx
  hooks/
    use-import-knowledge-base.ts
```

### Edge Function Structure
```
supabase/
  functions/
    import-knowledge-base/
      index.ts
      types.ts
      utils.ts
```

### API Contract
```typescript
// Request
{
  url: string;
  accountId: string;
}

// Response
{
  success: boolean;
  message: string;
  documentCount?: number;
  error?: string;
}
```

## Tips for Implementation 💡

1. **Follow Existing Patterns**
   - Look at other pages for component structure
   - Follow existing styling patterns
   - Use existing hooks where possible

2. **Error Handling**
   - Always show user-friendly error messages
   - Log detailed errors on backend
   - Handle all async operations properly

3. **Testing**
   - Test with small datasets first
   - Test error cases explicitly
   - Test with realistic data sizes

4. **Performance**
   - Don't block the UI while processing
   - Show immediate feedback to users
   - Handle large datasets gracefully
