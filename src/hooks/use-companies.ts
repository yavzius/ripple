import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

async function getCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, domain")
    .order("name");

  if (error) throw error;
  return data;
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies,
  });
} 