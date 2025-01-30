import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceCompanies, useWorkspaceProducts } from "@/hooks/use-workspace-data";
import { OrderForm } from "../components/OrderForm";

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
      <div className="container max-w-3xl py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/orders")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Failed to load required data"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/orders")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New Order</CardTitle>
          <CardDescription>
            Create a new order by selecting a company and adding products.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
    </div>
  );
} 