import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductWithCompany, PRODUCT_STATUS, PRODUCT_STATUS_CONFIG, ProductStatus } from "../types";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce
    .number()
    .min(0, "Price must be greater than or equal to 0")
    .transform((val) => Number(val.toFixed(2))),
  status: z.enum([
    PRODUCT_STATUS.ACTIVE,
    PRODUCT_STATUS.INACTIVE,
    PRODUCT_STATUS.DRAFT,
    PRODUCT_STATUS.ARCHIVED,
  ]).default(PRODUCT_STATUS.DRAFT),
});

type ProductFormValues = {
  name: string;
  price: number;
  status: ProductStatus;
};

interface ProductFormProps {
  product?: ProductWithCompany;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting?: boolean;
}

export function ProductForm({
  product,
  onSubmit,
  isSubmitting = false,
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          price: product.price,
          status: product.status,
        }
      : {
          name: "",
          price: 0,
          status: PRODUCT_STATUS.DRAFT,
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter product price"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(PRODUCT_STATUS_CONFIG).map((config) => (
                    <SelectItem key={config.value} value={config.value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
      </form>
    </Form>
  );
} 