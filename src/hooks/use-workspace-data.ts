import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "./use-workspace";
import { supabase } from "@/lib/supabase";
import type { SelectOption } from "@/types/common";

export const workspaceKeys = {
  all: ["workspace"] as const,
  companies: (workspaceId: string) => [...workspaceKeys.all, "companies", workspaceId] as const,
  customers: (workspaceId: string) => [...workspaceKeys.all, "customers", workspaceId] as const,
  // Add more workspace-related query keys as needed
};

/**
 * Hook to fetch companies in the current workspace
 * This is optimized for select/dropdown use cases
 */
export function useWorkspaceCompanies() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: workspaceKeys.companies(workspace?.id ?? ""),
    queryFn: async () => {
      if (!workspace?.id) return [];

      const { data, error } = await supabase
        .from("customer_companies")
        .select("id, name")
        .eq("account_id", workspace.id)
        .order("name");

      if (error) throw error;
      return (data || []) as SelectOption[];
    },
    enabled: !!workspace?.id,
  });
}

/**
 * Hook to fetch full company data in the current workspace
 * This includes all company fields, not just id/name
 */
export function useWorkspaceCompaniesDetailed() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: workspaceKeys.companies(workspace?.id ?? ""),
    queryFn: async () => {
      if (!workspace?.id) return [];

      const { data, error } = await supabase
        .from("customer_companies")
        .select("*")
        .eq("account_id", workspace.id)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspace?.id,
  });
}

/**
 * Hook to fetch customers in the current workspace
 */
export function useWorkspaceCustomers() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: workspaceKeys.customers(workspace?.id ?? ""),
    queryFn: async () => {
      if (!workspace?.id) return [];

      const { data, error } = await supabase
        .from("customers")
        .select(`
          id,
          first_name,
          last_name,
          email,
          customer_company:customer_companies (
            id,
            name
          )
        `)
        .eq("customer_companies.account_id", workspace.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspace?.id,
  });
} 