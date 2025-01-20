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
        setLoading(true);
        console.log("Fetching workspace data for slug:", workspaceSlug);

        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No session found, redirecting to auth");
          navigate("/auth");
          return;
        }

        if (!workspaceSlug) {
          console.log("No workspace slug provided, redirecting to workspaces");
          navigate("/workspaces");
          return;
        }

        // Fetch workspace details
        const { data: workspaceData, error: workspaceError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("slug", workspaceSlug)
          .maybeSingle();

        if (workspaceError) {
          console.error("Workspace error:", workspaceError);
          toast("Error loading workspace");
          navigate("/workspaces");
          return;
        }

        if (!workspaceData) {
          console.log("No workspace found for slug:", workspaceSlug);
          toast("Workspace not found");
          navigate("/workspaces");
          return;
        }

        console.log("Workspace data found:", workspaceData);

        // Verify user's membership
        const { data: membership, error: membershipError } = await supabase
          .from("workspace_members")
          .select("*")
          .eq("workspace_id", workspaceData.id)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (membershipError) {
          console.error("Membership error:", membershipError);
          toast("Error checking workspace access");
          navigate("/workspaces");
          return;
        }

        if (!membership) {
          console.log("No membership found for user");
          toast("You don't have access to this workspace");
          navigate("/workspaces");
          return;
        }

        console.log("Membership verified:", membership);
        setWorkspace(workspaceData);
      } catch (error) {
        console.error("Error in workspace validation:", error);
        toast("Failed to load workspace");
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