import { useParams } from "react-router-dom";
import { ProductDetails } from "../components/ProductDetails";
import { useProduct } from "../hooks/use-products";

export default function ProductView() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-semibold">Product Not Found</h2>
        <p className="text-muted-foreground">
          The product you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return <ProductDetails product={product} />;
} 