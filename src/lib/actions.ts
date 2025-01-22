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

export type TicketWithRelations = Ticket & {
  customer: User | null;
}

export type MessageWithSender = Message & {
  sender: User | null;
}

export type TicketWithMessages = {
  ticket: TicketWithRelations;
  messages: MessageWithSender[];
}

// Error handling helper
const handleError = (error: Error | null) => {
  if (error) {
    console.error('Database error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
};

export async function getTickets() {
  try {
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        created_at,
        updated_at,
        customer_id,
        resolved_at,
        subject,
        customer:users (
          id,
          email,
          first_name,
          last_name,
          customer_company:customer_companies (
            id,
            name,
            domain
          )
        )
      `)
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
    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:customer_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) throw new Error('Ticket not found');

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    return {
      ticket,
      messages: messages || []
    };
  } catch (error) {
    console.error('Error fetching ticket with messages:', error);
    throw error;
  }
}

export async function createMessage(data: {
  ticket_id: string;
  content: string;
  sender_id: string;
  metadata?: Record<string, any>;
}) {
  const { data: message, error } = await supabase
    .from('messages')
    .insert([data])
    .select(`
      *,
      sender:sender_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
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
