import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
type Tables = Database['public']['Tables'];
type Organization = Tables['organizations']['Row'];
type User = Tables['users']['Row'];
type Ticket = Tables['tickets']['Row'];
type Message = Tables['messages']['Row'];
type Document = Tables['documents']['Row'];

// Remove duplicate types
type UserRole = 'admin' | 'agent' | 'customer';

interface UserBasicInfo {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface TicketWithRelations extends Omit<Ticket, 'customer_id' | 'assignee_id'> {
  customer: UserBasicInfo | null;
  assignee: UserBasicInfo | null;
}

interface MessageWithUser extends Omit<Message, 'sender_id'> {
  sender: UserBasicInfo;
}

// Error handling helper
const handleError = (error: Error | null) => {
  if (error) {
    console.error('Database error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
};

// Organizations CRUD
export async function getOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*');
  handleError(error);
  return data;
}

export async function getOrganization(id: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();
  handleError(error);
  return data;
}

export async function createOrganization(organization: Partial<Tables['organizations']['Insert']>) {
  if (!organization.name || !organization.workspace_id) {
    throw new Error('Organization name and workspace_id are required');
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert([{
      name: organization.name,
      workspace_id: organization.workspace_id,
      ...organization
    }])
    .select()
    .single();
  handleError(error);
  return data;
}

export async function updateOrganization(id: string, updates: Partial<Tables['organizations']['Update']>) {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  handleError(error);
  return data;
}

export async function deleteOrganization(id: string) {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id);
  handleError(error);
}

// Users CRUD
export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  handleError(error);
  return data;
}

export async function getCustomers() {
  const { data, error } = await supabase
    .from('users')
    .select('*, organizations(*)')
    .eq('role', 'customer');
  handleError(error);
  return data;
}

export async function getUser(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  handleError(error);
  return data;
}

export async function createUser(user: Partial<Tables['users']['Insert']>) {
  // Validate user role
  if (!user.role || !['admin', 'agent', 'customer'].includes(user.role)) {
    throw new Error('Invalid user role. Must be admin, agent, or customer');
  }

  // Only customers should have an organization_id
  if (user.role !== 'customer' && user.organization_id) {
    throw new Error('Only customers can be associated with organizations');
  }

  if (user.role === 'customer' && !user.organization_id) {
    throw new Error('Customers must be associated with an organization');
  }

  if (!user.email) {
    throw new Error('Email is required');
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
      ...user
    }])
    .select()
    .single();
  handleError(error);
  return data;
}

export async function updateUser(id: string, updates: Partial<Tables['users']['Update']>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  handleError(error);
  return data;
}

export async function deleteUser(id: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  handleError(error);
}

// Tickets CRUD
function transformUserToBasicInfo(userData: any): UserBasicInfo | null {
  if (!userData || typeof userData !== 'object') return null;
  if ('error' in userData) return null; // Handle Supabase error case
  return {
    id: userData.id || '',
    email: userData.email || '',
    full_name: userData.full_name,
    avatar_url: userData.avatar_url
  };
}

function transformTicketData(ticketData: any): TicketWithRelations {
  const { customer_id, assignee_id, ...rest } = ticketData;
  return {
    ...rest,
    customer: transformUserToBasicInfo(ticketData.customer),
    assignee: transformUserToBasicInfo(ticketData.assignee)
  } as TicketWithRelations;
}

function transformMessageData(messageData: any): MessageWithUser {
  return {
    ...messageData,
    sender: transformUserToBasicInfo(messageData.sender) || {
      id: '',
      email: '',
      full_name: null,
      avatar_url: null
    }
  };
}

const CACHE_TIME = 1000 * 60 * 5; // 5 minutes
const STALE_TIME = 1000 * 30; // 30 seconds

export async function getTickets() {
  try {
    // Get current session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;
    if (!session?.user?.id) throw new Error('Not authenticated');

    // Get user details and verify admin/agent role
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) throw userError;
    if (!userDetails) throw new Error('User details not found');
    if (!['admin', 'agent'].includes(userDetails.role)) {
      throw new Error('Unauthorized: Admin or agent role required');
    }

    // Get all tickets with customer and assignee info
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:customer_id!inner (
          id,
          email,
          full_name,
          avatar_url
        ),
        assignee:assignee_id!left (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (ticketsError) throw ticketsError;
    if (!ticketsData) return [];

    return ticketsData.map(transformTicketData);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
}

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: getTickets,
    gcTime: CACHE_TIME,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
    retry: 2,
  });
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
      .select('role, organization_id')
      .eq('id', session.user.id)
      .single();
    
    if (userError) throw userError;
    if (!userDetails) throw new Error('User details not found');
    if (userDetails.role !== 'customer') throw new Error('Unauthorized: Only for customers');
    if (!userDetails.organization_id) return [];

    // Get tickets for customer's organization
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        *,
        customer:customer_id!inner (
          id,
          email,
          full_name,
          avatar_url
        ),
        assignee:assignee_id!left (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('organization_id', userDetails.organization_id)
      .order('created_at', { ascending: false });

    if (ticketsError) throw ticketsError;
    if (!ticketsData) return [];

    return ticketsData.map(transformTicketData);
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    throw error;
  }
}

export async function getTicket(id: string) {
  const { data: ticketData, error } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:customer_id!inner (
        id,
        email,
        full_name,
        avatar_url
      ),
      assignee:assignee_id!left (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();
  handleError(error);
  
  if (!ticketData) return null;
  return transformTicketData(ticketData);
}

async function generateTicketNumber(workspace_id: string): Promise<string> {
  // Start a transaction to ensure atomicity
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) throw authError;

  // Use RPC to generate ticket number atomically
  const { data, error } = await supabase.rpc('generate_ticket_number', {
    workspace_id: workspace_id
  });
  handleError(error);
  
  if (!data) {
    throw new Error('Failed to generate ticket number');
  }

  return data;
}

export async function createTicket(ticket: Omit<Partial<Tables['tickets']['Insert']>, 'workspace_id' | 'ticket_number'>) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  // Get user details to check their role and organization
  const { data: user, error: userDetailsError } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', userData.user.id)
    .single();
  handleError(userDetailsError);

  if (!user.organization_id) {
    throw new Error('User must belong to an organization');
  }

  // Get workspace_id from organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('workspace_id')
    .eq('id', user.organization_id)
    .single();
  handleError(orgError);

  if (!org?.workspace_id) {
    throw new Error('Organization must belong to a workspace');
  }

  const ticketNumber = await generateTicketNumber(org.workspace_id);

  let ticketData: Tables['tickets']['Insert'] = {
    ...ticket,
    ticket_number: ticketNumber,
    status: ticket.status || 'open',
    priority: ticket.priority || 'medium',
    workspace_id: org.workspace_id,
    subject: ticket.subject || '',
    customer_id: user.role === 'customer' ? userData.user.id : ticket.customer_id || '',
    organization_id: user.role === 'customer' ? user.organization_id : ticket.organization_id || ''
  };

  if (user.role === 'customer') {
    // Customers create tickets for their own organization
    ticketData = {
      ...ticketData,
      customer_id: userData.user.id,
      organization_id: user.organization_id,
    };
  } else {
    // Admins/Agents can create tickets on behalf of customers
    if (!ticket.customer_id || !ticket.organization_id) {
      throw new Error('Customer and organization must be specified when creating ticket as admin/agent');
    }
    ticketData = {
      ...ticketData,
      customer_id: ticket.customer_id,
      organization_id: ticket.organization_id,
    };
  }

  // First insert the ticket
  const { data: newTicket, error } = await supabase
    .from('tickets')
    .insert([ticketData])
    .select()
    .single();
  
  handleError(error);
  if (!newTicket) throw new Error('Failed to create ticket');

  // Then fetch the ticket with relationships
  const { data: ticketWithRelations, error: relationError } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:customer_id!inner (
        id,
        email,
        full_name,
        avatar_url
      ),
      assignee:assignee_id!left (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('id', newTicket.id)
    .single();

  handleError(relationError);
  return transformTicketData(ticketWithRelations);
}

export async function updateTicket(id: string, updates: Partial<Tables['tickets']['Update']>) {
  const { data: ticketData, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      customer:customer_id!inner (
        id,
        email,
        full_name,
        avatar_url
      ),
      assignee:assignee_id!left (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .single();
  handleError(error);
  
  if (!ticketData) return null;
  return transformTicketData(ticketData);
}

export async function deleteTicket(id: string) {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);
  handleError(error);
}

// Messages CRUD
export async function getMessages(ticketId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id!inner (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  handleError(error);
  return data as MessageWithUser[];
}

export async function createMessage(message: Partial<Tables['messages']['Insert']>) {
  if (!message.content) {
    throw new Error('Message content is required');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([{
      content: message.content,
      ...message
    }])
    .select(`
      *,
      sender:sender_id!inner (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .single();
  handleError(error);
  return data as MessageWithUser;
}

export async function updateMessage(id: string, updates: Partial<Tables['messages']['Update']>) {
  const { data, error } = await supabase
    .from('messages')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      sender:sender_id!inner (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .single();
  handleError(error);
  return data as MessageWithUser;
}

export async function deleteMessage(id: string) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);
  handleError(error);
}

// Documents CRUD
export async function getDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*');
  handleError(error);
  return data;
}

export async function getDocument(id: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();
  handleError(error);
  return data;
}

export async function createDocument(document: Partial<Tables['documents']['Insert']>) {
  if (!document.content || !document.title) {
    throw new Error('Document content and title are required');
  }

  const { data, error } = await supabase
    .from('documents')
    .insert([{
      content: document.content,
      title: document.title,
      ...document
    }])
    .select()
    .single();
  handleError(error);
  return data;
}

export async function updateDocument(id: string, updates: Partial<Tables['documents']['Update']>) {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  handleError(error);
  return data;
}

export async function deleteDocument(id: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);
  handleError(error);
}

// Additional helper functions
export async function getOrganizationUsers(organizationId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId);
  handleError(error);
  return data;
}

export async function getOrganizationTickets(organizationId: string) {
  const { data: ticketsData, error } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:customer_id!inner (
        id,
        email,
        full_name,
        avatar_url
      ),
      assignee:assignee_id!left (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('organization_id', organizationId);
  handleError(error);
  
  if (!ticketsData) return [];
  return ticketsData.map(transformTicketData);
}

export async function getOrganizationDocuments(organizationId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('organization_id', organizationId);
  handleError(error);
  return data;
}

export async function searchDocuments(query: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .textSearch('content', query);
  handleError(error);
  return data;
}

export async function getTicketMessages(ticketId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id!inner (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  handleError(error);
  return data as MessageWithUser[];
}

export async function getTicketWithMessages(id: string) {
  // First get the ticket
  const { data: ticketData, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:customer_id!inner (
        id,
        email,
        full_name,
        avatar_url
      ),
      assignee:assignee_id!left (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();
  
  handleError(ticketError);
  
  if (!ticketData) return null;

  // Then get messages separately to handle ordering
  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id!inner (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  handleError(messagesError);
  
  return {
    ticket: transformTicketData(ticketData),
    messages: (messagesData || []).map(transformMessageData)
  };
}

export function useTicketWithMessages(id: string | undefined) {
  return useQuery({
    queryKey: ['ticket', 'messages', id],
    queryFn: () => {
      if (!id) return null;
      return getTicketWithMessages(id);
    },
    gcTime: CACHE_TIME,
    staleTime: STALE_TIME,
    enabled: !!id,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMessage,
    onSuccess: (newMessage) => {
      // Invalidate the specific ticket's messages cache
      queryClient.invalidateQueries({
        queryKey: ['ticket', 'messages', newMessage.ticket_id],
      });
    },
  });
}
