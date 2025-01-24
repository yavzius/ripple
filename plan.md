# Demo Content Generation Plan

## Overview
Create realistic demo content for new Ripple workspaces focused on premium beauty brands, showcasing sales and support interactions between brand representatives and high-end retailers/distributors.

## Content Structure

### 1. Customers (10)
- Luxury department stores (Nordstrom, Saks-like profiles)
- High-end salon chains
- Premium beauty retailers
- International distributors (EU, Asia)
- Luxury spa chains
- Premium beauty influencers

### 2. Product Lines (For Reference)
- LUXE-SK-2023: Premium Skincare Collection
  - SK001: Anti-aging Serum ($120)
  - SK002: Hydrating Cream ($95)
  - SK003: Eye Treatment ($85)
- LUXE-HC-2023: Professional Hair Care
  - HC001: Keratin Treatment ($150)
  - HC002: Scalp Revival System ($125)
- LUXE-MC-2023: Mineral Makeup Collection
  - MC001: Foundation Set ($75)
  - MC002: Contour Palette ($90)

### 3. Conversations (20)
Each conversation will have 5-10 messages showcasing different scenarios:
- Wholesale order negotiations
- Product launch discussions
- Inventory restocking
- Exclusive distribution agreements
- Training and certification requests
- Product performance reviews
- Seasonal promotion planning
- Custom packaging requests

### 4. Workflow Demonstrations
- Lead qualification workflow
  - New distributor inquiry → Sales qualification → Meeting scheduling
- Order processing workflow
  - Quote request → Negotiation → Order confirmation → Fulfillment
- Support escalation workflow
  - Issue reported → Initial response → Internal escalation → Resolution
- Account management workflow
  - Quarterly review → Feedback collection → Action items → Follow-up

### 5. Tickets (3-4)
Generated from conversations, focusing on:
- Large volume order processing
- Custom packaging requirements
- Training program coordination
- Distribution agreement negotiations

### 6. Timeline Distribution
- Current week: Active negotiations and follow-ups
- Last week: Order processing and confirmations
- 2 weeks ago: Initial inquiries and product discussions
- Last month: Completed deals and resolved support cases

### 7. Customer Segments
Primary focus on:
- Enterprise accounts (>$500k annual)
- Mid-size luxury retailers ($100k-500k annual)
- International distributors
- Premium spa chains
- High-end salon networks

### 8. Regional Distribution
- North America (40% of conversations)
- Europe (30% of conversations)
- Asia Pacific (20% of conversations)
- Middle East (10% of conversations)

## Implementation Notes
1. Use industry-specific terminology (MOQ, MSRP, MAP pricing)
2. Include sales-focused language and negotiation elements
3. Demonstrate value-based selling approaches
4. Show proper handling of international business requirements
5. Include references to exclusivity agreements and territory protection

# Technical Implementation Guide

## 1. Edge Function Setup Checklist
- [ ] Create new edge function directory
  ```bash
  supabase/functions/generate-demo-content/
  ```
- [ ] Set up required files
  - [ ] index.ts (main function)
  - [ ] types.ts (shared types)
  - [ ] generators.ts (data generation logic)
  - [ ] templates.ts (conversation/message templates)
- [ ] Configure environment variables
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_SERVICE_ROLE_KEY

## 2. Implementation Steps

### Step 1: Edge Function Structure
```typescript
// supabase/functions/generate-demo-content/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DemoContentGenerator } from './generators.ts'

serve(async (req) => {
  // Implementation here
})
```

### Step 2: Data Generation Classes
- [ ] Create base generator class
- [ ] Implement company generation
- [ ] Implement customer generation
- [ ] Implement conversation generation
- [ ] Implement message generation
- [ ] Implement ticket generation

### Step 3: Template Data
- [ ] Create company templates
  - [ ] NA region companies
  - [ ] EU region companies
  - [ ] APAC region companies
  - [ ] ME region companies
- [ ] Create conversation templates
  - [ ] Sales scenarios
  - [ ] Support scenarios
  - [ ] Training scenarios
- [ ] Create message templates
  - [ ] Customer inquiries
  - [ ] Agent responses
  - [ ] Follow-ups
- [ ] Create ticket templates
  - [ ] Order processing
  - [ ] Support escalation
  - [ ] Training coordination

### Step 4: Client Integration
- [ ] Add UI button in workspace settings
- [ ] Implement progress tracking
- [ ] Add error handling
- [ ] Add success/failure notifications

## 3. Edge Function Implementation

```typescript
// supabase/functions/generate-demo-content/index.ts

const BATCH_SIZE = 5;

serve(async (req) => {
  const { accountId, userId } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const generator = new DemoContentGenerator(supabase, accountId, userId)

  try {
    // Process in batches to avoid timeout
    const companies = await generator.generateCompanies();
    
    for (let i = 0; i < companies.length; i += BATCH_SIZE) {
      const batch = companies.slice(i, i + BATCH_SIZE);
      await generator.processBatch(batch);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## 4. Testing Checklist
- [ ] Local Testing
  - [ ] Test edge function locally
  - [ ] Verify data generation
  - [ ] Check relationships
  - [ ] Validate content
- [ ] Production Testing
  - [ ] Deploy edge function
  - [ ] Test with real workspace
  - [ ] Verify performance
  - [ ] Check error handling

## 5. Deployment Checklist
- [ ] Edge Function Deployment
  - [ ] Deploy to Supabase
  - [ ] Set environment variables
  - [ ] Test deployed function
- [ ] Client Updates
  - [ ] Deploy UI changes
  - [ ] Test integration
  - [ ] Monitor errors

## 6. Monitoring Plan
- [ ] Set up error tracking
- [ ] Monitor function execution time
- [ ] Track success/failure rates
- [ ] Set up alerts for failures

## 7. Rollback Plan
- [ ] Implement data cleanup function
- [ ] Create rollback triggers
- [ ] Test rollback functionality
- [ ] Document recovery procedures

## 8. Documentation
- [ ] Update API documentation
- [ ] Document error codes
- [ ] Add troubleshooting guide
- [ ] Document testing procedures

## Security Considerations
- [ ] Verify authentication
- [ ] Check authorization
- [ ] Validate inputs
- [ ] Sanitize data
- [ ] Rate limiting
- [ ] Audit logging

## Performance Optimization
- [ ] Batch operations
- [ ] Optimize queries
- [ ] Monitor memory usage
- [ ] Cache templates
- [ ] Use bulk inserts

Remember:
- Edge functions have a 10-second timeout
- Use batching for large operations
- Implement proper error handling
- Monitor function execution
- Keep security in mind

# Database Implementation Details

## Table Structure and Relationships

### 1. Customer Companies Table (`customer_companies`)
```typescript
interface CustomerCompanyInsert {
  account_id: string;     // FK to accounts
  name: string;          
  domain: string | null;  // Optional
  created_at?: string;    // Auto-generated
  updated_at?: string;    // Auto-generated
}
```

### 2. Customers Table (`customers`)
```typescript
interface CustomerInsert {
  id: string;                    // UUID
  customer_company_id: string;   // FK to customer_companies
  email: string | null;         
  first_name: string | null;
  last_name: string | null;
  created_at?: string;          // Auto-generated
}
```

### 3. Conversations Table (`conversations`)
```typescript
interface ConversationInsert {
  id: string;                    // UUID
  account_id: string;            // FK to accounts
  customer_id: string;           // FK to customers
  channel: string;               // 'web' for demo
  status: string;                // 'open' or 'resolved'
  happiness_score: number | null;
  created_at?: string;           // Auto-generated
  resolved_at?: string | null;   // Set when status = 'resolved'
}
```

### 4. Messages Table (`messages`)
```typescript
interface MessageInsert {
  id: string;                    // UUID
  conversation_id: string;       // FK to conversations
  content: string;
  sender_type: string;           // 'customer' or 'agent'
  sentiment_score: number | null;
  created_at?: string;           // Auto-generated
}
```

### 5. Tickets Table (`tickets`)
```typescript
interface TicketInsert {
  id: string;                    // UUID
  account_id: string;            // FK to accounts
  conversation_id: string | null; // FK to conversations
  assigned_to: string | null;     // FK to users
  title: string | null;
  description: string | null;
  priority: string;              // 'low', 'medium', 'high'
  status: string;                // 'open', 'in_progress', 'resolved'
  created_at?: string;           // Auto-generated
  updated_at?: string;           // Auto-generated
}
```

## Implementation Class

```typescript
// src/utils/demo-data/generators.ts

export class DemoContentGenerator {
  private accountId: string;
  private userId: string;  // For ticket assignment
  
  constructor(accountId: string, userId: string) {
    this.accountId = accountId;
    this.userId = userId;
  }

  async generateCustomerCompany(data: {
    name: string;
    region: 'NA' | 'EU' | 'APAC' | 'ME';
    type: 'department_store' | 'salon' | 'retailer' | 'distributor' | 'spa';
  }) {
    const { data: company, error } = await supabase
      .from('customer_companies')
      .insert({
        account_id: this.accountId,
        name: data.name,
        domain: data.name.toLowerCase().replace(/\s+/g, '') + '.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return company;
  }

  async generateCustomer(companyId: string, data: {
    firstName: string;
    lastName: string;
  }) {
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        customer_company_id: companyId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@${companyId}.com`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return customer;
  }

  async generateConversation(customerId: string, data: {
    timeframe: 'current_week' | 'last_week' | 'two_weeks_ago' | 'last_month';
    status: 'open' | 'resolved';
    happiness_score?: number;
  }) {
    const created_at = this.getDateForTimeframe(data.timeframe);
    const resolved_at = data.status === 'resolved' ? 
      new Date(new Date(created_at).getTime() + 24 * 60 * 60 * 1000).toISOString() : 
      null;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        account_id: this.accountId,
        customer_id: customerId,
        channel: 'web',
        status: data.status,
        happiness_score: data.happiness_score || null,
        created_at,
        resolved_at
      })
      .select()
      .single();

    if (error) throw error;
    return conversation;
  }

  async generateMessage(conversationId: string, data: {
    content: string;
    sender_type: 'customer' | 'agent';
    sentiment_score?: number;
    created_at: string;
  }) {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: data.content,
        sender_type: data.sender_type,
        sentiment_score: data.sentiment_score || null,
        created_at: data.created_at
      })
      .select()
      .single();

    if (error) throw error;
    return message;
  }

  async generateTicket(conversationId: string, data: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'in_progress' | 'resolved';
  }) {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        account_id: this.accountId,
        conversation_id: conversationId,
        assigned_to: this.userId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return ticket;
  }
}
```

## Transaction Handling

```typescript
async function generateDemoContent(accountId: string, userId: string) {
  const generator = new DemoContentGenerator(accountId, userId);
  
  try {
    // Start with companies
    const companies = await Promise.all(
      DEMO_COMPANIES.map(company => generator.generateCustomerCompany(company))
    );

    // Generate customers for each company
    const customers = await Promise.all(
      companies.flatMap(company => 
        DEMO_CUSTOMERS[company.id].map(customer =>
          generator.generateCustomer(company.id, customer)
        )
      )
    );

    // Generate conversations and messages
    const conversations = await Promise.all(
      customers.flatMap(customer =>
        DEMO_SCENARIOS.map(scenario =>
          generator.generateConversation(customer.id, scenario)
        )
      )
    );

    // Generate tickets for selected conversations
    await Promise.all(
      conversations
        .filter(conv => TICKET_SCENARIOS.has(conv.id))
        .map(conv => generator.generateTicket(conv.id, TICKET_SCENARIOS.get(conv.id)!))
    );

  } catch (error) {
    console.error('Failed to generate demo content:', error);
    // Implement rollback logic here
    throw error;
  }
}
```

## Data Validation

1. Required Fields:
   - account_id (all tables)
   - customer_company_id (customers)
   - conversation_id (messages)
   - content (messages)
   - sender_type (messages)

2. Enum Values:
   - conversation.status: 'open' | 'resolved'
   - message.sender_type: 'customer' | 'agent'
   - ticket.priority: 'low' | 'medium' | 'high'
   - ticket.status: 'open' | 'in_progress' | 'resolved'

3. Timestamps:
   - created_at: auto-generated, ISO string
   - updated_at: auto-generated, ISO string
   - resolved_at: optional, ISO string

4. Foreign Keys:
   - All IDs must exist in referenced tables
   - Cascade delete where appropriate
