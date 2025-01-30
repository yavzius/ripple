import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceCompanies, useWorkspaceProducts } from "@/hooks/use-workspace-data";
import { OrderForm } from "../components/OrderForm";
import { PageLayout } from "@/components/layout/PageLayout";

export default function CreateOrder() {
  const navigate = useNavigate();
  const { 
    data: companies, 
    isLoading: isLoadingCompanies,
    error: companiesError 
  } = useWorkspaceCompanies();
  const { 
    data: products, 
    isLoading: isLoadingProducts,
    error: productsError 
  } = useWorkspaceProducts();

  const isLoading = isLoadingCompanies || isLoadingProducts;
  const error = companiesError || productsError;

  if (error) {
    return (
      <PageLayout
        title="Error"
        backTo="/orders"
      >
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Failed to load required data"}
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="New Order"
      backTo="/orders"
    >
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-[200px] w-full" />
              </div>
            </div>
          ) : (
            <OrderForm
              companies={companies?.map(company => ({
                id: company.id,
                name: company.name,
              })) || []}
              products={products?.map(product => ({
                id: product.id,
                name: product.name,
                price: product.price,
              })) || []}
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
} 