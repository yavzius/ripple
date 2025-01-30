import { useParams } from "react-router-dom";
import { useOrder } from "../hooks/use-orders";
import { OrderDetails, OrderDetailsSkeleton } from "../components/OrderDetails";

export default function OrderView() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrder(orderId!);

  if (isLoading) {
    return <OrderDetailsSkeleton />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Order not found</h2>
        <p className="text-sm text-muted-foreground">
          The order you're looking for doesn't exist or you don't have access to it.
        </p>
      </div>
    );
  }

  return <OrderDetails order={order} />;
} 