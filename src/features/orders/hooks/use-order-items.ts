import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  OrderItemCreateMutation,
  OrderItemUpdateMutation,
  OrderItemDeleteMutation,
} from '../types';
import {
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
} from '../services/orders';

export function useOrderItems() {
  const queryClient = useQueryClient();

  const addItem = useMutation({
    mutationFn: ({ orderId, item }: OrderItemCreateMutation) =>
      addOrderItem(orderId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Item added to order');
    },
    onError: (error) => {
      console.error('Error adding item to order:', error);
      toast.error('Failed to add item to order');
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, updates }: OrderItemUpdateMutation) =>
      updateOrderItem(itemId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Item updated');
    },
    onError: (error) => {
      console.error('Error updating order item:', error);
      toast.error('Failed to update item');
    },
  });

  const removeItem = useMutation({
    mutationFn: ({ itemId }: OrderItemDeleteMutation) =>
      removeOrderItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Item removed from order');
    },
    onError: (error) => {
      console.error('Error removing order item:', error);
      toast.error('Failed to remove item');
    },
  });

  return {
    addItem,
    updateItem,
    removeItem,
  };
} 