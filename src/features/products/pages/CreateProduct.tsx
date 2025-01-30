import { useNavigate } from "react-router-dom";
import { ProductForm } from "../components/ProductForm";
import { useCreateProduct } from "../hooks/use-products";
import { PageLayout } from "@/components/layout/PageLayout";

export default function CreateProduct() {
  const navigate = useNavigate();
  const { mutate: createProduct, isPending } = useCreateProduct();

  return (
    <PageLayout
      title="Create Product"
      backTo="/products"
    >
      <ProductForm
        onSubmit={(values) => {
          createProduct(values, {
            onSuccess: (product) => {
              navigate(`/products/${product.id}`);
            },
          });
        }}
        isSubmitting={isPending}
      />
    </PageLayout>
  );
} 
