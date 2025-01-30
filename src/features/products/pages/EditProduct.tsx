import { useNavigate, useParams } from "react-router-dom";
import { useWorkspaceCompanies } from "@/hooks/use-workspace-data";
import { ProductForm } from "../components/ProductForm";
import { useProduct, useUpdateProduct } from "../hooks/use-products";
import { PageLayout } from "@/components/layout/PageLayout";

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: companies = [] } = useWorkspaceCompanies();
  const { data: product, isLoading: isLoadingProduct } = useProduct(id!);
  const { mutate: updateProduct, isPending } = useUpdateProduct();

  if (isLoadingProduct) {
    return (
      <PageLayout
        title="Loading..."
        backTo={`/products/${id}`}
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
      title="Edit Product"
      backTo={`/products/${id}`}
    >
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
    </PageLayout>
  );
} 
