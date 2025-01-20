import { useEffect, useState } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "./DashboardLayout";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

const LoadingState = () => (
  <DashboardLayout>
    <div className="p-8 space-y-4">
      <Skeleton className="h-8 w-[250px]" />
      <div className="grid gap-4">
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  </DashboardLayout>
);

const WorkspaceLayout = () => {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaceAndValidate = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          navigate("/auth");
          return;
        }

        if (!workspaceSlug) {
          navigate("/workspaces");
          return;
        }

        // Fetch workspace details
        const { data: workspace, error: workspaceError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("slug", workspaceSlug)
          .single();

        if (workspaceError || !workspace) {
          console.error("Workspace error:", workspaceError);
          toast.error("Workspace not found");
          navigate("/workspaces");
          return;
        }

        // Verify user's membership
        const { data: membership, error: membershipError } = await supabase
          .from("workspace_members")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("user_id", session.session.user.id)
          .single();

        if (membershipError || !membership) {
          console.error("Membership error:", membershipError);
          toast.error("You don't have access to this workspace");
          navigate("/workspaces");
          return;
        }

        setWorkspace(workspace);
      } catch (error) {
        console.error("Error in workspace validation:", error);
        toast.error("Failed to load workspace");
        navigate("/workspaces");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceAndValidate();
  }, [workspaceSlug, navigate]);

  if (loading) {
    return <LoadingState />;
  }

  if (!workspace) {
    return null;
  }

  return (
    <DashboardLayout>
      <Outlet context={{ workspace }} />
    </DashboardLayout>
  );
};

export default WorkspaceLayout;