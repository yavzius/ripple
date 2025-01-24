import { supabase } from '@/integrations/supabase/client';
import { Database } from '../../database.types';

// Types
type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];
type Ticket = Tables['tickets']['Row'];
type Message = Tables['messages']['Row'];
type Document = Tables['documents']['Row'];

// Remove duplicate types
type UserRole = 'admin' | 'agent' | 'customer';

interface UserBasicInfo {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

export type TicketWithRelations = Database['public']['Tables']['tickets']['Row'] & {
  conversation: {
    id: string;
    resolved_at: string | null;
    customer: {
      id: string;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
      customer_company: {
        id: string;
        name: string | null;
        domain: string | null;
      } | null;
    } | null;
  } | null;
};

export type MessageWithSender = Database['public']['Tables']['messages']['Row'];

export type TicketWithMessages = {
  ticket: TicketWithRelations;
  messages: MessageWithSender[];
};

export type CompanyWithCustomers = Database['public']['Tables']['customer_companies']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'][];
};

// Error handling helper
const handleError = (error: Error | null) => {
  if (error) {
    console.error('Database error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
};

export async function getTickets() {
  try {
    // Get current session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;
    if (!session?.user?.id) throw new Error('Not authenticated');

    // Get user's current workspace
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('current_account_id')
      .eq('id', session.user.id)
      .single();

    if (userError) throw userError;
    if (!user?.current_account_id) throw new Error('No workspace selected');

    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        created_at,
        updated_at,
        title,
        description,
        priority,
        status,
        assigned_to,
        conversation:conversations (
          id,
          customer:customers (
            id,
            email,
            first_name,
            last_name,
            customer_company:customer_companies!Customers_customer_company_id_fkey (
              id,
              name,
              domain
            )
          )
        )
      `)
      .eq('account_id', user.current_account_id)
      .order('created_at', { ascending: false });

    if (ticketsError) throw ticketsError;
    if (!ticketsData) return [];

    return ticketsData;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
}

export async function getCustomerTickets() {
  try {
    // Get current session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;
    if (!session?.user?.id) throw new Error('Not authenticated');

    // Get customer details
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('role, customer_company_id')
      .eq('id', session.user.id)
      .single();
    
    if (userError) throw userError;
    if (!userDetails) throw new Error('User details not found');
    if (userDetails.role !== 'contact') throw new Error('Unauthorized: Only for contacts');
    if (!userDetails.customer_company_id) return [];

    // Get tickets for customer's company
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:customer_id (
          id,
          email,
          first_name,
          last_name
        ),
        assignee:assignee_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('customer_company_id', userDetails.customer_company_id)
      .order('created_at', { ascending: false });

    if (ticketsError) throw ticketsError;
    if (!ticketsData) return [];

    return ticketsData;
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    throw error;
  }
}

export async function getTicketWithMessages(id: string): Promise<TicketWithMessages> {
  try {
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        conversation:conversation_id (
          id,
          resolved_at,
          customer:customer_id (
            id,
            email,
            first_name,
            last_name,
            customer_company:customer_company_id (
              id,
              name,
              domain
            )
          ),
          messages (
            *
          )
        )
      `)
      .eq('id', id)
      .single();

    console.log(ticket);

    if (ticketError) throw ticketError;
    if (!ticket) throw new Error('Ticket not found');

    return {
      ticket,
      messages: ticket.conversation?.messages || []
    };
  } catch (error) {
    console.error('Error fetching ticket with messages:', error);
    throw error;
  }
}

export async function createMessage(data: {
  conversation_id: string;
  content: string;
  sender_type: 'agent' | 'customer';
}) {
  const { data: message, error } = await supabase
    .from('messages')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return message;
}

export async function updateTicket(id: string, updates: Partial<Ticket>) {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      customer:customer_id (
        id,
        email,
        first_name,
        last_name
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function createTicket(data: Ticket) {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert([data])
    .select()
    .single();
}

export async function getCustomers(customer_company_id: string){
    const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'customer')
    .eq('customer_company_id', customer_company_id)

    if (error) throw error;
    if (!data) return [];

    return data;
}

export async function getCompanies(accountId: string) {
  try {
    const { data: companies, error } = await supabase
      .from('customer_companies')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('account_id', accountId);

    if (error) throw error;
    if (!companies) return [];

    return companies as CompanyWithCustomers[];
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}

export async function getCompanyWithCustomers(id: string, accountId: string) {
  try {
    const { data: company, error } = await supabase
      .from('customer_companies')
      .select(`
        *,
        customers (
          id,
          email,
          first_name,
          last_name,
          created_at,
          conversations (
            id,
            created_at,
            status,
            resolved_at,
            messages (
              id,
              content,
              created_at,
              sender_type
            )
          )
        )
      `)
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (error) throw error;
    if (!company) throw new Error('Company not found');

    return company;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}

export async function updateConversationStatus(id: string, status: 'open' | 'resolved' | 'closed') {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        status,
        ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
      })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    handleError(error as Error);
    return { success: false, error };
  }
}

export async function mergeConversations(sourceId: string, targetId: string) {
  const { error: messagesError } = await supabase
    .from('messages')
    .update({ conversation_id: targetId })
    .eq('conversation_id', sourceId);

  if (messagesError) {
    handleError(messagesError);
    return { error: messagesError };
  }

  // Delete the source conversation after moving all messages
  const { error: deleteError } = await supabase
    .from('conversations')
    .delete()
    .eq('id', sourceId);

  if (deleteError) {
    handleError(deleteError);
    return { error: deleteError };
  }

  return { error: null };
}
