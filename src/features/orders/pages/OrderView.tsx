import { useNavigate, useParams } from "react-router-dom";
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
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <p className="text-muted-foreground">
            The order you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Order #${order.order_number}`}
      backTo="/orders"
      primaryAction={{
        label: "Edit Order",
        href: `/orders/${orderId}/edit`
      }}
      secondaryAction={{
        label: "Delete Order",
        href: `/orders/${orderId}/delete`
      }}
    >
      <OrderDetails order={order} />
    </PageLayout>
  );
} 