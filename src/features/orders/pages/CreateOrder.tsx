import { useWorkspaceCompanies } from "@/hooks/use-workspace-data";
import { OrderForm } from "../components/OrderForm";

export default function CreateOrder() {
  const { data: companies, isLoading } = useWorkspaceCompanies();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Create Order</h2>
        <p className="text-sm text-muted-foreground">
          Create a new order for a company
        </p>
      </div>

      <OrderForm companies={companies || []} />
    </div>
  );
} 