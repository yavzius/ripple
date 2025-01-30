import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Product, PRODUCT_STATUS_CONFIG } from "../types";
import { PageLayout } from "@/components/layout/PageLayout";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const statusConfig = PRODUCT_STATUS_CONFIG[product.status];

  return (
    <PageLayout
      title={product.name}
      backTo="/products"
      actions={
        <Button asChild>
          <Link to={`/products/${product.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Product
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Basic Information</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{product.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Price</p>
              <p>{formatCurrency(product.price)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <StatusBadge
                status={statusConfig.label}
                variant={statusConfig.variant}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Timestamps</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p>{formatDate(product.created_at, "PPpp")}</p>
            </div>
            {product.updated_at && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p>{formatDate(product.updated_at, "PPpp")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
} 