import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from './use-workspace';
import type { Database } from '@/types/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export function useProducts() {
  const { workspace } = useWorkspace();

  return useQuery({
    queryKey: ['products', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('account_id', workspace?.id)
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!workspace?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
} 
