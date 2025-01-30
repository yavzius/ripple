# System Design: Single-Prompt Order Creation Feature

This document outlines a proposed architecture for a feature that takes a single user prompt (e.g., "Create an order for this account") and performs the following actions:
1. Identifies the requested account based on the user's text input.
2. Creates an order for that account.
3. Tracks the entire process within LangSmith for observability and runtime tracing.

---

## Overview

We will utilize three primary libraries/services:
1. **LangChain** for prompt handling, model calls, and orchestrating chain logic.
2. **LangGraph** for building a small state machine (or graph) of tasks (nodes) that need to be performed:  
   - Identify account.  
   - Create an order.  
3. **LangSmith** for tracking and visualizing prompt interactions, chain executions, tool usage, and final outputs.  

---

## High-Level Flow

1. User submits a single request (via UI or API) with a prompt like "Create an order for [account_name]."
2. System enters the LangGraph workflow, capturing:
   - The user message and relevant metadata (conversation ID, timestamp, etc.) into LangSmith for logging and observation.
3. **Node A** (Identify Account Node):  
   - Leverages a small LLM prompt or simple text extraction logic (regex, search, or fuzzy matching).  
   - Finds the best matching account from a known list (e.g., from Supabase or an external CRM).  
   - Logs the outcome to LangSmith.
4. **Node B** (Create Order Node):  
   - Once the account is identified, invokes a "createOrder" tool or function that performs the order creation in your database or external system.  
   - Logs the final result (e.g., "Order #1234 created for Acme Inc.") to LangSmith for future analytics.
5. Outputs a final message summarizing the success/failure of the order creation.

---

## Detailed Steps

1. **LangChain** Prompt Handling:  
   - Use a custom prompt template that includes straightforward instructions to parse out the desired "account_name" from the user's text.  
   - Alternatively, if the prompt is extremely simple, we may skip advanced parsing and rely on direct text manipulation.

2. **LangGraph** State Machine:  
   - **Node: IdentifyAccount**  
     - Input: User message.  
     - Action: Parse (or retrieve) the account name from the text; search or match it in the accounts table.  
     - Output: The matched account ID.  
   - **Node: CreateOrder**  
     - Input: Account ID from previous node.  
     - Action: Call a "createOrder(accountId)" function that writes a new record to the "orders" table or calls an external service.  
     - Output: A success/failure status and order details.

3. **LangSmith** Observability:  
   - Each node's invocation is logged in LangSmith with:  
     - Input data (parsed text, user message).  
     - Output data (account ID, order ID).  
     - Timestamps for chain execution.  
   - Any LLM tooling or function calls also produce fully traceable logs in your LangSmith workspace.

4. **createOrder Tool**  
   - A small function or class that receives the matched "accountId" and the user's request context (like product, quantity, etc.--if applicable).  
   - Persists a new order in the database or calls an external system.  
   - Returns data that is appended to the final chain output.

5. **Error Handling & Logging**  
   - If an account is not found:
     - Return a modified result, "Account not found for: [extractedName]. Please check and try again."  
   - If order creation fails:
     - Return a localized error message.  
   - All exceptions captured in LangSmith for debugging.

---

## Example Interaction Flow

1. **User Input**:  
   "Create an order for Galaxy Cosmetics with 3 sample items."  

2. **Identify Account** Node:  
   - Extract "Galaxy Cosmetics."  
   - Query accounts; find account_id = `1234`.  

3. **Create Order** Node:  
   - Run `createOrder(1234, { items: 3, notes: "sample items" })`.  

4. **System Output**:  
   "Successfully created order #789 for Galaxy Cosmetics with 3 sample items."

5. **LangSmith Logs**:  
   - Each step, node, and final result is stored in LangSmith for analysis.

---

## Updated Design Plan

Below is an updated plan incorporating the clarifications:

1. **Fuzzy Account Matching**  
   - When the user types a prompt (e.g., "Create an order for Galxy Cosmetics"), the system will:
     1. Fetch a list of account names (for which the user has access).
     2. Use a fuzzy-search mechanism to find the best match based on the text within the prompt.

2. **Single Required Field**  
   - No additional information is necessary beyond the account name.  
   - If the prompt does not contain a recognizable account, return an error message (e.g., "No identifiable account was found.").

3. **Supabase Integration**  
   - All accounts are stored in a single Supabase table.  
   - Fuzzy search can be done client-side or via a small server/Edge Function, returning the best matched account before order creation.

4. **Order Creation**  
   - If an account is identified, create a new order record in the database (or an external service).  
   - Log any failures to LangSmith, along with an error message for the user (e.g., "Order creation failed. Please try again.").

5. **LangSmith Logging**  
   - Run a single "waterfall" chain or graph representing the entire flow:
     1. Prompt ingestion → Identify Account.  
     2. Create Order.  
   - Capture relevant steps (LLM calls, fuzzy search results, final success/failure) so you can observe them in LangSmith.

6. **User-Facing Experience**  
   - A small widget (e.g., a chatbox) appears in the corner of the website. The user:
     1. Types their request.  
     2. Sees a loading indicator while the system identifies the account and creates the order.  
     3. Receives streaming updates, such as:  
        - "Looking for the account..."  
        - "Account found: Galaxy Cosmetics."  
        - "Creating order..."  
        - "Successfully created order #XYZ."  
   - This streaming approach gives immediate feedback at each step of the process.

7. **Final Output**  
   - The user sees a definitive success message ("Order #XYZ created for Galaxy Cosmetics") or an error message if no account was found or if order creation failed.  
   - This message is also logged in LangSmith, allowing you to confirm the correct account was matched and the order was created successfully.

---

## UI Component

### ✅ Phase 1: UI Component Development

#### ✅ Step 1: Project Setup and Dependencies
- ✅ Environment Setup:
  - ✅ All required dependencies installed
  - ✅ Tailwind CSS configured
  - ✅ Custom animations added

#### ✅ Step 2: Magical Circle Component
- ✅ Floating action button with:
  - ✅ Gradient background
  - ✅ Pulsing animation
  - ✅ Hover effects
  - ✅ Focus states
  - ✅ Plus icon
- ✅ Dialog integration
- ✅ TypeScript types
- ✅ Accessibility features

#### 🔄 Step 3: Input Box and Dialog Integration (In Progress)
- ✅ Basic dialog UI
- ✅ Text area input
- ✅ Cancel and Create Order buttons
- ❌ Order creation functionality
- ❌ State management
- ❌ Loading states
- ❌ Error handling

## Supabase Edge Function

✅ Edge Function Implementation:
- ✅ Created `create-order` Edge Function
- ✅ Implemented LangChain and LangGraph integration
- ✅ Added customer company search functionality
- ✅ Added order creation logic
- ✅ Implemented proper error handling and CORS
- ✅ Successfully deployed to Supabase

The Edge Function:
- ✅ Handles the input from the user
- ✅ Uses LangGraph for workflow management
- ✅ Correctly inserts new orders into the `orders` table
- ✅ Logs the process in LangSmith for observability

## Database Considerations

1. Create Text Search Index:
   ```sql
   -- Add a tsvector column for the account name
   ALTER TABLE accounts 
   ADD COLUMN name_fts tsvector 
   GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;

   -- Create a GIN index on the tsvector column
   CREATE INDEX accounts_name_fts ON accounts USING gin(name_fts);
   ```

2. Existing Schema:
   - The current database schema is sufficient for the order creation feature
   - The `orders` table is correctly referenced in the Edge Function
   - Text search capabilities are now optimized for account name matching

3. Performance Considerations:
   - Text search index will improve account name matching performance
   - Consider monitoring query performance and adjusting index configuration if needed

## Error Handling

- Include error handling for scenarios where the account cannot be identified or the order creation fails. This should be reflected in both the UI feedback and the LangSmith logs.

## Security and Permissions

- Ensure the plan includes a section on security, particularly around the Supabase Edge Function, to prevent unauthorized access.

---

## Conclusion

This approach provides a straightforward, auditable pipeline from a single user prompt ("Create an order for this account") to final action (order creation). By combining LangChain for prompt modeling, LangGraph for state management, and LangSmith for robust tracking, we get well-structured, easily monitored flows that are both flexible and maintainable.

## Detailed Implementation Plan for Junior Developer

## Phase 1: UI Component Development

### ✅ Step 1: Project Setup and Dependencies
1. Environment Setup:
   - ✅ Install required dependencies
   - ✅ Configure Tailwind CSS
   - ✅ Set up animations

2. TypeScript Types Setup:
   - ✅ Create types for order creation
   - ✅ Set up utility functions

### ✅ Step 2: Magical Circle Component
1. Create the FAB Component:
   - ✅ Implement floating action button
   - ✅ Add animations and styling
   - ✅ Implement accessibility features

### 🔄 Step 3: Input Box and Dialog Integration
1. Create the Dialog Component:
   - ✅ Basic dialog structure
   - ✅ Input fields
   - ❌ State management
   - ❌ Order creation logic

## Phase 2: Local Testing Setup

### Step 1: Test Environment Setup
1. Configure Test Dependencies:
   - [ ] Create a `.env` file with required environment variables:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   LANGSMITH_API_KEY=your_langsmith_api_key
   ```
   - [ ] Install additional testing dependencies:
   ```bash
   npm install -D @langchain/openai langchain zod dotenv
   ```

### Step 2: Test Implementation
1. Create Test Suite:
   - [ ] Implement test cases in `_tests_/order.ts`:
     - Account name extraction from prompts
     - Fuzzy matching for account names
     - Order creation flow
     - Error handling scenarios

2. Test Components:
   - [ ] Schema validation using Zod
   - [ ] LangChain integration for prompt processing
   - [ ] Supabase database operations
   - [ ] Fuzzy matching algorithm for account names

### Step 3: Test Execution
1. Run Test Cases:
   - [ ] Test various prompt formats
   - [ ] Test with exact and approximate account names
   - [ ] Verify order creation in database
   - [ ] Validate error handling

2. Verify Test Results:
   - [ ] Check console output for each test case
   - [ ] Verify database entries
   - [ ] Validate error messages
   - [ ] Ensure proper logging in LangSmith

## Phase 3: Supabase Edge Function Implementation

### Step 1: Edge Function Setup
1. Create Edge Function:
   - [ ] Create a new Edge Function for order creation:
   ```typescript
   // supabase/functions/create-order/index.ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   import { createClient } from '@supabase/supabase-js'
   import { LangChain } from 'langchain'
   import { LangSmith } from 'langsmith'

   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   }
   ```

2. Environment Configuration:
   - [ ] Set up environment variables:
   ```typescript
   const supabaseUrl = Deno.env.get('SUPABASE_URL')
   const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
   const langSmithApiKey = Deno.env.get('LANGSMITH_API_KEY')
   ```

### Step 2: Account Identification Logic
1. Implement Account Matching:
   ```typescript
   async function findAccount(prompt: string, supabase) {
     const { data: accounts } = await supabase
       .from('accounts')
       .select('id, name')
       .order('created_at')

     // Implement fuzzy matching logic
     const matches = accounts.map(account => ({
       account,
       score: calculateSimilarity(prompt, account.name)
     }))
     .sort((a, b) => b.score - a.score)

     return matches[0]?.score > 0.7 ? matches[0].account : null
   }
   ```

### Step 3: Order Creation Logic
1. Implement Order Creation:
   ```typescript
   async function createOrder(accountId: string, supabase) {
     const { data, error } = await supabase
       .from('orders')
       .insert([
         { 
           account_id: accountId,
           status: 'new',
           created_at: new Date().toISOString()
         }
       ])
       .select()
       .single()

     if (error) throw error
     return data
   }
   ```

## Phase 4: Database and Performance Optimization

### Step 1: Database Indexes
1. Add Required Indexes:
   ```sql
   -- Add index for account name search
   CREATE INDEX idx_accounts_name ON accounts USING GIN (name gin_trgm_ops);
   
   -- Add index for order queries
   CREATE INDEX idx_orders_account_id ON orders (account_id);
   ```

### Step 2: Query Optimization
1. Implement Efficient Queries:
   ```typescript
   // Example of an optimized account search query
   const searchAccounts = async (searchTerm: string) => {
     const { data, error } = await supabase
       .from('accounts')
       .select('id, name')
       .textSearch('name', searchTerm)
       .limit(5)
   }
   ```

## Phase 5: Error Handling and Security

### Step 1: Error Handling Implementation
1. Create Error Types:
   ```typescript
   // src/types/errors.ts
   export enum OrderCreationError {
     ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
     CREATION_FAILED = 'CREATION_FAILED',
     UNAUTHORIZED = 'UNAUTHORIZED'
   }

   export class OrderError extends Error {
     constructor(
       public type: OrderCreationError,
       public message: string,
       public details?: any
     ) {
       super(message);
     }
   }
   ```

2. Implement Error Handling:
   ```typescript
   // src/hooks/useOrderCreation.ts
   const handleError = (error: OrderError) => {
     switch (error.type) {
       case OrderCreationError.ACCOUNT_NOT_FOUND:
         setStatus('Could not find the specified account');
         break;
       case OrderCreationError.CREATION_FAILED:
         setStatus('Failed to create the order');
         break;
       default:
         setStatus('An unexpected error occurred');
     }
   }
   ```

### Step 2: Security Implementation
1. Add Authentication Checks:
   ```typescript
   // supabase/functions/create-order/index.ts
   const authenticate = async (req: Request) => {
     const authHeader = req.headers.get('Authorization')
     if (!authHeader) throw new OrderError(OrderCreationError.UNAUTHORIZED, 'No auth token')
     
     // Verify JWT token
     const token = authHeader.replace('Bearer ', '')
     const { data: { user }, error } = await supabase.auth.getUser(token)
     if (error) throw new OrderError(OrderCreationError.UNAUTHORIZED, 'Invalid token')
     
     return user
   }
   ```

## Phase 6: Testing Implementation

### Step 1: Unit Tests
1. Create Test Suite:
   ```typescript
   // src/__tests__/OrderCreation.test.ts
   import { render, fireEvent, waitFor } from '@testing-library/react'
   import { OrderCreationDialog } from '../components/OrderCreationDialog'

   describe('OrderCreationDialog', () => {
     it('should handle successful order creation', async () => {
       const { getByPlaceholderText, getByText } = render(<OrderCreationDialog />)
       
       fireEvent.change(getByPlaceholderText('Create an order for...'), {
         target: { value: 'Create order for Test Company' },
       })
       
       fireEvent.click(getByText('Create Order'))
       
       await waitFor(() => {
         expect(getByText(/Order #\d+ created/)).toBeInTheDocument()
       })
     })
   })
   ```

### Step 2: Integration Tests
1. Implement E2E Tests:
   ```typescript
   // cypress/integration/order-creation.spec.ts
   describe('Order Creation Flow', () => {
     it('should create an order successfully', () => {
       cy.visit('/')
       cy.get('[data-testid="magical-circle"]').click()
       cy.get('[data-testid="order-prompt"]')
         .type('Create order for Test Company')
       cy.get('[data-testid="create-order-button"]').click()
       cy.get('[data-testid="order-status"]')
         .should('contain', 'Order created successfully')
     })
   })
   ```

## Phase 7: Documentation

### Step 1: Technical Documentation
1. Create Documentation Files:
   ```markdown
   # Order Creation Feature

   ## Components
   - MagicalCircle: Floating action button for initiating order creation
   - OrderCreationDialog: Dialog for entering order creation prompt
   
   ## Edge Functions
   - create-order: Handles order creation logic and account matching
   
   ## Database Schema
   - orders: Stores order information
   - accounts: Contains account details
   
   ## Error Handling
   - See OrderCreationError enum for possible error types
   ```

### Step 2: User Documentation
1. Create User Guide:
   ```markdown
   # Creating Orders with Magic Circle

   1. Click the pulsing circle in the bottom right corner
   2. Enter your order creation request (e.g., "Create order for Company X")
   3. Click "Create Order"
   4. Wait for confirmation
   
   ## Troubleshooting
   - If account not found: Check spelling and try again
   - If order creation fails: Contact support
   ```

This detailed implementation plan provides specific code examples, configurations, and clear steps for each phase of development. The junior developer can follow this guide to implement the feature successfully.
