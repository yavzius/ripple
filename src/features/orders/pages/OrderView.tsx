import { useNavigate, useParams } from "react-router-dom";
import { Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useOrder, useDeleteOrder } from "../hooks/use-orders";
import { OrderDetails, OrderDetailsSkeleton } from "../components/OrderDetails";
import { PageLayout } from "@/components/layout/PageLayout";

export default function OrderView() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrder(orderId!);
  const { mutate: deleteOrder } = useDeleteOrder();

  if (isLoading) {
    return (
      <PageLayout
        title="Loading..."
        backTo="/orders"
      >
        <OrderDetailsSkeleton />
      </PageLayout>
    );
  }

  if (!order) {
    return (
      <PageLayout
        title="Order Not Found"
        backTo="/orders"
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <p className="text-sm text-muted-foreground">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Order #${order.order_number}`}
      backTo="/orders"
      actions={
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
            description="This action cannot be undone. This will permanently delete the order and all its items."
            onConfirm={() => {
              deleteOrder(order.id);
              navigate("/orders");
            }}
          />
        </div>
      }
    >
      <OrderDetails order={order} />
    </PageLayout>
  );
} 