import { supabase } from "@/lib/supabase";
import { Product, ProductInsert, ProductUpdate } from "../types";

export async function getProducts(accountId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProduct(id: string, accountId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("account_id", accountId)
    .single();

  if (error) throw error;
  return data;
}

export async function createProduct(product: ProductInsert) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      price: product.price,
      status: product.status,
      account_id: product.account_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, product: ProductUpdate) {
  const { data, error } = await supabase
    .from("products")
    .update({
      name: product.name,
      price: product.price,
      status: product.status,
      account_id: product.account_id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string, accountId: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) throw error;
}

export async function updateProductStatus(productId: string, status: Product["status"], accountId: string) {
  const { data, error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", productId)
    .eq("account_id", accountId)
    .select()
    .single();

  if (error) throw error;
  return data;
} 
