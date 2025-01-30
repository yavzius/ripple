import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/hooks/use-workspace';
import { useToast } from '@/hooks/use-toast';
import {
  Order,
  OrderInsert,
  OrderStatus,
  OrderUpdate,
  OrderWithCompany,
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  getOrdersByCompany,
  updateOrder,
  updateOrderStatus,
} from '../services/orders';

// Query keys for React Query
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (accountId: string) => [...orderKeys.lists(), accountId] as const,
  companyOrders: (accountId: string, companyId: string) => 
    [...orderKeys.lists(), accountId, companyId] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (orderId: string) => [...orderKeys.details(), orderId] as const,
};

/**
 * Hook to fetch all orders for the current workspace
 */
export function useOrders() {
  const { workspace } = useWorkspace();
  
  return useQuery({
    queryKey: orderKeys.list(workspace?.id ?? ''),
    queryFn: () => getOrders(workspace?.id ?? ''),
    enabled: !!workspace?.id,
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });
}

/**
 * Hook to fetch orders for a specific company
 */
export function useCompanyOrders(companyId: string) {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: orderKeys.companyOrders(workspace?.id ?? '', companyId),
    queryFn: () => getOrdersByCompany(workspace?.id ?? '', companyId),
    enabled: !!workspace?.id && !!companyId,
  });
}

/**
 * Hook for creating a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (newOrder: Omit<OrderInsert, 'account_id'>) =>
      createOrder({ ...newOrder, account_id: workspace?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast({
        title: 'Order created',
        description: 'Your order has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating order',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for updating an existing order
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orderId, updates }: { orderId: string; updates: OrderUpdate }) =>
      updateOrder(orderId, updates),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast({
        title: 'Order updated',
        description: 'Your order has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating order',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for updating order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast({
        title: 'Status updated',
        description: 'Order status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating status',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for deleting an order
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast({
        title: 'Order deleted',
        description: 'The order has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting order',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for optimistic updates to order status
 */
export function useOptimisticUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onMutate: async ({ orderId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(orderId) });

      // Snapshot the previous value
      const previousOrder = queryClient.getQueryData<OrderWithCompany>(
        orderKeys.detail(orderId)
      );

      // Optimistically update to the new value
      if (previousOrder) {
        queryClient.setQueryData<OrderWithCompany>(
          orderKeys.detail(orderId),
          { ...previousOrder, status }
        );
      }

      return { previousOrder };
    },
    onError: (err, { orderId }, context) => {
      // Rollback to the previous value if there's an error
      if (context?.previousOrder) {
        queryClient.setQueryData(
          orderKeys.detail(orderId),
          context.previousOrder
        );
      }
      toast({
        title: 'Error updating status',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    },
    onSettled: (_, __, { orderId }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
} 