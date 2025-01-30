import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
} from "../services/products";
import type { ProductInsert, ProductUpdate, ProductStatus } from "../types";

// Query keys for React Query
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (accountId: string) => [...productKeys.lists(), accountId] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (accountId: string, productId: string) => [...productKeys.details(), accountId, productId] as const,
};

export function useProducts() {
  const { workspace } = useWorkspace();
  
  return useQuery({
    queryKey: productKeys.list(workspace?.id ?? ''),
    queryFn: () => getProducts(workspace?.id ?? ''),
    enabled: !!workspace?.id,
  });
}

export function useProduct(id: string) {
  const { workspace } = useWorkspace();
  
  return useQuery({
    queryKey: productKeys.detail(workspace?.id ?? '', id),
    queryFn: () => getProduct(id, workspace?.id ?? ''),
    enabled: !!workspace?.id && !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  return useMutation({
    mutationFn: (product: Omit<ProductInsert, 'account_id'>) => 
      createProduct({ ...product, account_id: workspace?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create product");
      console.error("Create product error:", error);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) =>
      updateProduct(id, { ...data, account_id: workspace?.id }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(workspace?.id ?? '', variables.id) });
      toast.success("Product updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update product");
      console.error("Update product error:", error);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id, workspace?.id ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete product");
      console.error("Delete product error:", error);
    },
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  return useMutation({
    mutationFn: ({ productId, status }: { productId: string; status: ProductStatus }) =>
      updateProductStatus(productId, status, workspace?.id ?? ''),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(workspace?.id ?? '', variables.productId) });
      toast.success("Product status updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update product status");
      console.error("Update product status error:", error);
    },
  });
} 