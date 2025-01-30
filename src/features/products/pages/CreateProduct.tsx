import { useNavigate } from "react-router-dom";
import { ProductForm } from "../components/ProductForm";
import { useCreateProduct } from "../hooks/use-products";

export default function CreateProduct() {
  const navigate = useNavigate();
  const { mutate: createProduct, isPending } = useCreateProduct();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Create Product</h2>
        <p className="text-sm text-muted-foreground">
          Add a new product to your catalog
        </p>
      </div>

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
    </div>
  );
} 
