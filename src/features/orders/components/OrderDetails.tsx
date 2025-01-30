import { useNavigate } from "react-router-dom";
import { Edit, Trash, ArrowLeft } from "lucide-react";
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
import { formatDate } from "@/lib/utils";
import { useDeleteOrder, useUpdateOrderStatus } from "../hooks/use-orders";
import {
  OrderDetailsProps,
  OrderStatus,
  ORDER_STATUS_CONFIG,
} from "../types";

export function OrderDetails({ order }: OrderDetailsProps) {
  const navigate = useNavigate();
  const { mutate: updateStatus } = useUpdateOrderStatus();
  const { mutate: deleteOrder } = useDeleteOrder();

  const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus] || ORDER_STATUS_CONFIG.pending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold">
            Order #{order.order_number}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/orders/${order.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <ConfirmDeleteDialog
            trigger={
              <Button variant="outline" size="icon">
                <Trash className="h-4 w-4" />
              </Button>
            }
            description="This action cannot be undone. This will permanently delete the order."
            onConfirm={() => {
              deleteOrder(order.id);
              navigate("/orders");
            }}
          />
        </div>
      </CardHeader>
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
  );
}

export function OrderDetailsSkeleton() {
  return (
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
  );
} 
