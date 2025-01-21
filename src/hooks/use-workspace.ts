import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];

const WORKSPACE_QUERY_KEY = ['workspace'] as const;

async function fetchWorkspace(): Promise<Workspace> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) throw authError;
  if (!session?.user?.id) throw new Error('Not authenticated');

  // First check if user is a member of any workspace
  const { data: memberData, error: memberError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', session.user.id)
    .single();

  if (memberError) throw memberError;
  if (!memberData?.workspace_id) throw new Error('No workspace found');

  // Then fetch the workspace details
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', memberData.workspace_id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Workspace not found');
  
  return data as Workspace;
}

export function useWorkspace() {
  const queryClient = useQueryClient();

  const { data: workspace, isLoading: loading, error } = useQuery<Workspace>({
    queryKey: WORKSPACE_QUERY_KEY,
    queryFn: fetchWorkspace,
    enabled: true, // Always enabled since we handle auth in the fetch function
    initialData: () => {
      // Try to get data from cache first
      return queryClient.getQueryData<Workspace>(WORKSPACE_QUERY_KEY);
    },
  });

  // Subscribe to real-time changes if needed
  // useEffect(() => {
  //   const channel = supabase
  //     .channel('workspace_changes')
  //     .on('postgres_changes', 
  //       { event: '*', schema: 'public', table: 'workspaces' },
  //       (payload) => {
  //         queryClient.setQueryData(WORKSPACE_QUERY_KEY, payload.new);
  //       }
  //     )
  //     .subscribe();
  //
  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [queryClient]);

  return {
    workspace,
    loading,
    error,
    // Utility functions for managing the cache
    invalidate: () => queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY }),
    setWorkspace: (data: Workspace) => queryClient.setQueryData(WORKSPACE_QUERY_KEY, data),
    clear: () => queryClient.removeQueries({ queryKey: WORKSPACE_QUERY_KEY }),
  };
} 