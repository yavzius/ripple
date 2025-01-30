import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import type { OrderItemsTableProps } from '../types';

export function OrderItemsTable({
  items,
  onUpdateQuantity,
  onRemoveItem,
  isEditable = false,
}: OrderItemsTableProps) {
  const [editingQuantity, setEditingQuantity] = useState<{
    [key: string]: number;
  }>({});

  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity > 0) {
      setEditingQuantity((prev) => ({ ...prev, [itemId]: quantity }));
    }
  };

  const handleUpdateQuantity = (itemId: string) => {
    const quantity = editingQuantity[itemId];
    if (quantity && onUpdateQuantity) {
      onUpdateQuantity(itemId, quantity);
      setEditingQuantity((prev) => {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="w-[100px] text-right">Price</TableHead>
            <TableHead className="w-[100px] text-right">Quantity</TableHead>
            <TableHead className="w-[100px] text-right">Total</TableHead>
            {isEditable && <TableHead className="w-[100px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.product.name}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.product.price)}
              </TableCell>
              <TableCell className="text-right">
                {isEditable && onUpdateQuantity ? (
                  <div className="flex items-center justify-end space-x-2">
                    <Input
                      type="number"
                      min="1"
                      value={
                        editingQuantity[item.id] !== undefined
                          ? editingQuantity[item.id]
                          : item.quantity
                      }
                      onChange={(e) =>
                        handleQuantityChange(item.id, e.target.value)
                      }
                      className="w-20 text-right"
                    />
                    {editingQuantity[item.id] !== undefined && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateQuantity(item.id)}
                      >
                        Update
                      </Button>
                    )}
                  </div>
                ) : (
                  item.quantity
                )}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.product.price * item.quantity)}
              </TableCell>
              {isEditable && onRemoveItem && (
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={isEditable ? 5 : 4} className="text-center">
                No items in this order
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 