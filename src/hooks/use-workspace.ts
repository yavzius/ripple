import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


type Workspace = Database["public"]["Tables"]["accounts"]["Row"];

const WORKSPACE_QUERY_KEY = ['workspace'] as const;

async function fetchWorkspace(): Promise<Workspace> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) throw authError;
  if (!session?.user?.id) throw new Error('Not authenticated');

  // First check if user is a member of any workspace
  const { data: memberData, error: memberError } = await supabase
    .from('account_users')
    .select('account_id')
    .eq('user_id', session.user.id)
    .single();

  if (memberError) throw memberError;
  if (!memberData?.account_id) throw new Error('No workspace found');

  // Then fetch the workspace details
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', memberData.account_id)
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
      return queryClient.getQueryData<Workspace>(WORKSPACE_QUERY_KEY);
    },
  });

  return {
    workspace,
    loading,
    error,
    invalidate: () => queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY }),
    setWorkspace: (data: Workspace) => queryClient.setQueryData(WORKSPACE_QUERY_KEY, data),
    clear: () => queryClient.removeQueries({ queryKey: WORKSPACE_QUERY_KEY }),
  };
} 