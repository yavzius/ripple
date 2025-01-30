import { useNavigate, useParams } from "react-router-dom";
import { useWorkspaceCompanies } from "@/hooks/use-workspace-data";
import { ProductForm } from "../components/ProductForm";
import { useProduct, useUpdateProduct } from "../hooks/use-products";

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: companies = [] } = useWorkspaceCompanies();
  const { data: product, isLoading: isLoadingProduct } = useProduct(id!);
  const { mutate: updateProduct, isPending } = useUpdateProduct();

  if (isLoadingProduct) {
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Edit Product</h2>
        <p className="text-sm text-muted-foreground">
          Update product information
        </p>
      </div>

      <ProductForm
        product={product}
        companies={companies}
        onSubmit={(values) => {
          updateProduct(
            { id: product.id, data: values },
            {
              onSuccess: () => {
                navigate(`/products/${product.id}`);
              },
            }
          );
        }}
        isSubmitting={isPending}
      />
    </div>
  );
} 
