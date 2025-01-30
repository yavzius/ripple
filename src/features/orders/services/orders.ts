import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type OrderWithCompany = Order & {
  company: Database['public']['Tables']['customer_companies']['Row'] | null;
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

/**
 * Get all orders for an account with optional company details
 */
export async function getOrders(accountId: string): Promise<OrderWithCompany[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      company:customer_companies (
        id,
        name,
        domain
      )
    `)
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return orders as OrderWithCompany[];
}

/**
 * Get a single order by ID with company details
 */
export async function getOrderById(orderId: string): Promise<OrderWithCompany | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      company:customer_companies (
        id,
        name,
        domain
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return order as OrderWithCompany;
}

/**
 * Create a new order
 */
export async function createOrder(order: OrderInsert): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing order
 */
export async function updateOrder(
  orderId: string,
  updates: OrderUpdate
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an order
 */
export async function deleteOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) throw error;
}

/**
 * Get orders for a specific company
 */
export async function getOrdersByCompany(
  accountId: string,
  companyId: string
): Promise<OrderWithCompany[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      company:customer_companies (
        id,
        name,
        domain
      )
    `)
    .eq('account_id', accountId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return orders as OrderWithCompany[];
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
} 