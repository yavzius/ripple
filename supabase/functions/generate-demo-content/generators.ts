import { SupabaseClient } from '@supabase/supabase-js';
import { DemoCompany, DemoCustomer, DemoScenario } from './types.ts';
import { DEMO_COMPANIES, DEMO_CUSTOMERS, DEMO_SCENARIOS, getDateForTimeframe } from './templates.ts';

// Add UUID generation function
function generateUUID(): string {
  return crypto.randomUUID();
}

// Demo user IDs mapping
const DEMO_USER_IDS = {
  'Sarah Mitchell': '77a22105-e027-4fea-81ca-5d1def559de4',
  'James Wilson': 'cb8c7a00-05da-4ea6-8d02-6d0fcb9b2d12',
  'Emma Thompson': 'ec78c9e9-e3a2-4189-9c46-f8dc395c044d',
  'Alex Chen': 'f7d5e7c8-569d-4819-bd60-898e762f407a'
};

export class DemoContentGenerator {
  private createdRecords: {
    companies: string[];
    customers: string[];
    conversations: string[];
    messages: string[];
    tickets: string[];
  } = {
    companies: [],
    customers: [],
    conversations: [],
    messages: [],
    tickets: []
  };

  constructor(
    private supabase: SupabaseClient,
    private accountId: string,
    private userId: string
  ) {}

  async rollback() {
    try {
      // Delete in reverse order to handle foreign key constraints
      for (const ticketId of this.createdRecords.tickets) {
        await this.supabase.from('tickets').delete().eq('id', ticketId);
      }

      for (const messageId of this.createdRecords.messages) {
        await this.supabase.from('messages').delete().eq('id', messageId);
      }

      for (const conversationId of this.createdRecords.conversations) {
        await this.supabase.from('conversations').delete().eq('id', conversationId);
      }

      for (const customerId of this.createdRecords.customers) {
        await this.supabase.from('customers').delete().eq('id', customerId);
      }

      for (const companyId of this.createdRecords.companies) {
        await this.supabase.from('customer_companies').delete().eq('id', companyId);
      }

      // Clear the tracking arrays
      this.createdRecords = {
        companies: [],
        customers: [],
        conversations: [],
        messages: [],
        tickets: []
      };

      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }

  async generateCompanies() {
    const companies: any[] = [];
    
    try {
      for (const template of DEMO_COMPANIES) {
        const companyId = generateUUID();
        const { data: company, error } = await this.supabase
          .from('customer_companies')
          .insert({
            id: companyId,
            account_id: this.accountId,
            name: template.name,
            domain: template.name.toLowerCase().replace(/\s+/g, '-') + '.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        this.createdRecords.companies.push(company.id);
        companies.push(company);
      }
    } catch (error) {
      await this.rollback();
      throw error;
    }

    return companies;
  }

  async generateCustomersForCompany(companyId: string) {
    const customers: any[] = [];
    
    try {
      const templates = DEMO_CUSTOMERS.default;
      for (const template of templates) {
        const fullName = `${template.firstName} ${template.lastName}`;
        const customerId = DEMO_USER_IDS[fullName];
        
        if (!customerId) {
          console.warn(`No demo user ID found for ${fullName}, skipping...`);
          continue;
        }

        const { data: customer, error } = await this.supabase
          .from('customers')
          .insert({
            id: customerId,
            customer_company_id: companyId,
            first_name: template.firstName,
            last_name: template.lastName,
            email: `${template.firstName.toLowerCase()}.${template.lastName.toLowerCase()}@${companyId}.com`,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        this.createdRecords.customers.push(customer.id);
        customers.push(customer);
      }
    } catch (error) {
      await this.rollback();
      throw error;
    }

    return customers;
  }

  async generateConversationWithMessages(customerId: string, scenario: DemoScenario) {
    try {
      // Create conversation
      const conversationId = generateUUID();
      const { data: conversation, error: convError } = await this.supabase
        .from('conversations')
        .insert({
          id: conversationId,
          account_id: this.accountId,
          customer_id: customerId,
          channel: 'web',
          status: scenario.conversation.status,
          happiness_score: scenario.conversation.happiness_score,
          created_at: getDateForTimeframe(scenario.conversation.timeframe),
          resolved_at: scenario.conversation.status === 'resolved' ? 
            new Date().toISOString() : null
        })
        .select()
        .single();

      if (convError) throw convError;
      this.createdRecords.conversations.push(conversation.id);

      // Create messages
      const baseTime = new Date(conversation.created_at);
      for (const msgTemplate of scenario.messages) {
        const messageTime = new Date(baseTime.getTime() + (msgTemplate.delay_minutes || 0) * 60000);
        const messageId = generateUUID();
        
        const { data: message, error: msgError } = await this.supabase
          .from('messages')
          .insert({
            id: messageId,
            conversation_id: conversation.id,
            content: msgTemplate.content,
            sender_type: msgTemplate.sender_type,
            sentiment_score: msgTemplate.sentiment_score,
            created_at: messageTime.toISOString()
          })
          .select()
          .single();

        if (msgError) throw msgError;
        if (message) this.createdRecords.messages.push(message.id);
      }

      // Create ticket if scenario includes one
      if (scenario.ticket) {
        const ticketId = generateUUID();
        const { data: ticket, error: ticketError } = await this.supabase
          .from('tickets')
          .insert({
            id: ticketId,
            account_id: this.accountId,
            conversation_id: conversation.id,
            assigned_to: this.userId,
            title: scenario.ticket.title,
            description: scenario.ticket.description,
            priority: scenario.ticket.priority,
            status: scenario.ticket.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (ticketError) throw ticketError;
        if (ticket) this.createdRecords.tickets.push(ticket.id);
      }

      return conversation;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  async processBatch(companies: any[]) {
    try {
      // Distribute demo users across companies
      const templates = DEMO_CUSTOMERS.default;
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        // Get one customer template for each company, cycling through the available templates
        const template = templates[i % templates.length];
        const fullName = `${template.firstName} ${template.lastName}`;
        const customerId = DEMO_USER_IDS[fullName];
        
        if (!customerId) {
          console.warn(`No demo user ID found for ${fullName}, skipping...`);
          continue;
        }

        // Check if customer already exists
        const { data: existingCustomer, error: checkError } = await this.supabase
          .from('customers')
          .select('id')
          .eq('id', customerId)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing customer:', checkError);
          throw checkError;
        }

        // Skip if customer already exists
        if (existingCustomer) {
          console.log(`Customer ${fullName} already exists, skipping...`);
          continue;
        }

        const { data: customer, error } = await this.supabase
          .from('customers')
          .insert({
            id: customerId,
            customer_company_id: company.id,
            first_name: template.firstName,
            last_name: template.lastName,
            email: `${template.firstName.toLowerCase()}.${template.lastName.toLowerCase()}@${company.domain}`,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating customer:', error);
          throw error;
        }

        this.createdRecords.customers.push(customer.id);

        // Generate conversations for this customer
        for (const scenario of DEMO_SCENARIOS) {
          await this.generateConversationWithMessages(customer.id, scenario);
        }
      }
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
} 