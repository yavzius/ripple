import { useParams } from "react-router-dom";
import { useWorkspaceCompanies } from "@/hooks/use-workspace-data";
import { OrderForm } from "../components/OrderForm";
import { useOrder } from "../hooks/use-orders";
import { OrderDetailsSkeleton } from "../components/OrderDetails";

export default function EditOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading: isLoadingOrder } = useOrder(orderId!);
  const { data: companies, isLoading: isLoadingCompanies } = useWorkspaceCompanies();

  if (isLoadingOrder || isLoadingCompanies) {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Edit Order</h2>
        <p className="text-sm text-muted-foreground">
          Edit order details and status
        </p>
      </div>

      <OrderForm
        initialData={order}
        companies={companies || []}
      />
    </div>
  );
} 