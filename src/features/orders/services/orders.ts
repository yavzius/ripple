import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type {
  Order,
  OrderInsert,
  OrderUpdate,
  OrderWithDetails,
  OrderItem,
  OrderItemInsert,
  OrderItemUpdate,
  OrderItemWithProduct,
} from '../types';

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
 * Get all orders for an account with optional company details and items
 */
export async function getOrders(accountId: string): Promise<OrderWithDetails[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      company:customer_companies (
        id,
        name,
        domain
      ),
      items:order_items (
        *,
        product:products (
          *
        )
      )
    `)
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return orders.map((order) => ({
    ...order,
    items: order.items || [],
    total: calculateOrderTotal(order.items || []),
  })) as OrderWithDetails[];
}

/**
 * Get a single order by ID with company details and items
 */
export async function getOrderById(orderId: string): Promise<OrderWithDetails | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      company:customer_companies (
        id,
        name,
        domain
      ),
      items:order_items (
        *,
        product:products (
          *
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  
  return order ? {
    ...order,
    items: order.items || [],
    total: calculateOrderTotal(order.items || []),
  } as OrderWithDetails : null;
}

/**
 * Create a new order with items
 */
export async function createOrder(
  order: OrderInsert,
  items: Array<{ product_id: string; quantity: number }>
): Promise<OrderWithDetails> {
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (orderError) throw orderError;

  if (items.length > 0) {
    const orderItems = items.map((item) => ({
      order_id: newOrder.id,
      ...item,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;
  }

  return getOrderById(newOrder.id) as Promise<OrderWithDetails>;
}

/**
 * Update an existing order
 */
export async function updateOrder(
  orderId: string,
  updates: OrderUpdate
): Promise<OrderWithDetails> {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return getOrderById(data.id) as Promise<OrderWithDetails>;
}

/**
 * Delete an order and its items
 */
export async function deleteOrder(orderId: string): Promise<void> {
  // Delete order items first (foreign key constraint)
  const { error: itemsError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  if (itemsError) throw itemsError;

  // Then delete the order
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
): Promise<OrderWithDetails[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      company:customer_companies (
        id,
        name,
        domain
      ),
      items:order_items (
        *,
        product:products (
          *
        )
      )
    `)
    .eq('account_id', accountId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return orders.map((order) => ({
    ...order,
    items: order.items || [],
    total: calculateOrderTotal(order.items || []),
  })) as OrderWithDetails[];
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<OrderWithDetails> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return getOrderById(data.id) as Promise<OrderWithDetails>;
}

/**
 * Add item to order
 */
export async function addOrderItem(
  orderId: string,
  item: Omit<OrderItemInsert, 'order_id'>
): Promise<OrderItemWithProduct> {
  const { data, error } = await supabase
    .from('order_items')
    .insert({ ...item, order_id: orderId })
    .select(`
      *,
      product:products (
        *
      )
    `)
    .single();

  if (error) throw error;
  return data as OrderItemWithProduct;
}

/**
 * Update order item
 */
export async function updateOrderItem(
  itemId: string,
  updates: Omit<OrderItemUpdate, 'order_id'>
): Promise<OrderItemWithProduct> {
  const { data, error } = await supabase
    .from('order_items')
    .update(updates)
    .eq('id', itemId)
    .select(`
      *,
      product:products (
        *
      )
    `)
    .single();

  if (error) throw error;
  return data as OrderItemWithProduct;
}

/**
 * Remove item from order
 */
export async function removeOrderItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

/**
 * Calculate order total from items
 */
function calculateOrderTotal(items: OrderItemWithProduct[]): number {
  return items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
} 