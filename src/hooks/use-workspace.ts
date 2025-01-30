import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type Workspace = Database["public"]["Tables"]["accounts"]["Row"];

const WORKSPACE_QUERY_KEY = ['workspace'] as const;
const WORKSPACES_LIST_KEY = ['workspaces'] as const;

async function fetchWorkspace(): Promise<Workspace> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) throw authError;
  if (!session?.user?.id) throw new Error('Not authenticated');

  // Get user's current workspace from users table
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('current_account_id')
    .eq('id', session.user.id)
    .single();

  if (userError) throw userError;
  if (!user?.current_account_id) {
    // Fallback to first available workspace if no current workspace is set
    const { data: accountUser, error: accountUserError } = await supabase
      .from('accounts_users')
      .select('account_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single();

    if (accountUserError) throw accountUserError;
    if (!accountUser?.account_id) throw new Error('No workspace found');

    // Set this as current workspace
    const { error: updateError } = await supabase
      .from('users')
      .update({ current_account_id: accountUser.account_id })
      .eq('id', session.user.id);

    if (updateError) throw updateError;
    user.current_account_id = accountUser.account_id;
  }

  // Fetch the workspace details
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', user.current_account_id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Workspace not found');
  
  return data as Workspace;
}

async function fetchWorkspaces(): Promise<Workspace[]> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) throw authError;
  if (!session?.user?.id) throw new Error('Not authenticated');

  // Get all workspaces user has access to
  const { data, error } = await supabase
    .from('accounts')
    .select('*, accounts_users!inner(*)')
    .eq('accounts_users.user_id', session.user.id);

  if (error) throw error;
  return data as Workspace[];
}

async function switchWorkspace(accountId: string): Promise<void> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) throw authError;
  if (!session?.user?.id) throw new Error('Not authenticated');

  // Verify user has access to this workspace
  const { count, error: accessError } = await supabase
    .from('accounts_users')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('account_id', accountId);

  if (accessError) throw accessError;
  if (!count) throw new Error('No access to this workspace');

  // Update current workspace
  const { error: updateError } = await supabase
    .from('users')
    .update({ current_account_id: accountId })
    .eq('id', session.user.id);

  if (updateError) throw updateError;
}

export function useWorkspace() {
  const queryClient = useQueryClient();

  const { data: workspace, isLoading: loading, error } = useQuery<Workspace>({
    queryKey: WORKSPACE_QUERY_KEY,
    queryFn: fetchWorkspace,
    enabled: true,
    initialData: () => {
      return queryClient.getQueryData<Workspace>(WORKSPACE_QUERY_KEY);
    },
  });

  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: WORKSPACES_LIST_KEY,
    queryFn: fetchWorkspaces,
    enabled: true,
  });

  const { mutateAsync: switchToWorkspace } = useMutation({
    mutationFn: switchWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY });
    },
  });

  return {
    workspace,
    workspaces,
    loading,
    error,
    switchWorkspace: switchToWorkspace,
    invalidate: () => queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEY }),
    setWorkspace: (data: Workspace) => queryClient.setQueryData(WORKSPACE_QUERY_KEY, data),
    clear: () => {
      queryClient.removeQueries({ queryKey: WORKSPACE_QUERY_KEY });
      queryClient.removeQueries({ queryKey: WORKSPACES_LIST_KEY });
    },
  };
} 