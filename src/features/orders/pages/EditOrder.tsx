import { useParams } from "react-router-dom";
import { useWorkspaceCompanies } from "@/hooks/use-workspace-data";
import { OrderForm } from "../components/OrderForm";
import { useOrder } from "../hooks/use-orders";
import { OrderDetailsSkeleton } from "../components/OrderDetails";
import { PageLayout } from "@/components/layout/PageLayout";

export default function EditOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading: isLoadingOrder } = useOrder(orderId!);
  const { data: companies, isLoading: isLoadingCompanies } = useWorkspaceCompanies();

  if (isLoadingOrder || isLoadingCompanies) {
    return (
      <PageLayout
        title="Loading..."
        backTo={`/orders/${orderId}`}
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
      title="Edit Order"
      backTo={`/orders/${orderId}`}
    >
      <OrderForm
        initialData={order}
        companies={companies || []}
      />
    </PageLayout>
  );
} 