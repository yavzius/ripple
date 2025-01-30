import { useParams } from "react-router-dom";
import { useProduct } from "../hooks/use-products";
import { ProductDetails } from "../components/ProductDetails";
import { PageLayout } from "@/components/layout/PageLayout";

export default function ProductView() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);

  if (isLoading) {
    return (
      <PageLayout
        title="Loading..."
        backTo="/products"
      >
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!product) {
    return (
      <PageLayout
        title="Product Not Found"
        backTo="/products"
      >
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <p className="text-muted-foreground">
            The product you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={product.name}
      backTo="/products"
      primaryAction={{
        label: "Edit Product",
        href: `/products/${id}/edit`
      }}
    >
      <ProductDetails product={product} />
    </PageLayout>
  );
} 