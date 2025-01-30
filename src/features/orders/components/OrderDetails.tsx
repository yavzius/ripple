import { useNavigate } from "react-router-dom";
import { Edit, Trash, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useDeleteOrder, useUpdateOrderStatus } from "../hooks/use-orders";
import { useOrderItems } from "../hooks/use-order-items";
import { OrderItemsTable } from "./OrderItemsTable";
import {
  OrderDetailsProps,
  OrderStatus,
  ORDER_STATUS,
  ORDER_STATUS_CONFIG,
} from "../types";

export function OrderDetails({ order }: OrderDetailsProps) {
  const navigate = useNavigate();
  const { mutate: updateStatus } = useUpdateOrderStatus();
  const { mutate: deleteOrder } = useDeleteOrder();
  const { updateItem, removeItem } = useOrderItems();

  const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus] || ORDER_STATUS_CONFIG.pending;

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    updateItem.mutate({
      orderId: order.id,
      itemId,
      updates: { quantity },
    });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem.mutate({
      orderId: order.id,
      itemId,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Order ID</p>
              <p className="font-mono text-sm">{order.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Company</p>
              <p className="text-sm">{order.company?.name || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm">
                {formatDate(order.created_at)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Status</p>
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={statusConfig.label}
                  variant={statusConfig.variant}
                />
                <Select
                  value={order.status || ""}
                  onValueChange={(value) =>
                    updateStatus({ orderId: order.id, status: value as OrderStatus })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ORDER_STATUS_CONFIG).map((config) => (
                      <SelectItem key={config.value} value={config.value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Order Items</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/orders/${order.id}/edit`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <OrderItemsTable
            items={order.items}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            isEditable={order.status !== ORDER_STATUS.COMPLETED && order.status !== ORDER_STATUS.CANCELLED}
          />
          <div className="mt-4 flex justify-end">
            <div className="space-y-1">
              <p className="text-sm font-medium text-right">Total</p>
              <p className="text-xl font-bold">{formatCurrency(order.total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OrderDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-8 w-[200px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-6 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border-b last:border-b-0">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-8 w-[100px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
