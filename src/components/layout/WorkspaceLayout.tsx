import { useEffect, useState } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "./DashboardLayout";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

const WorkspaceLayout = () => {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
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

        const { data: workspace, error } = await supabase
          .from("workspaces")
          .select("*")
          .eq("slug", workspaceSlug)
          .single();

        if (error) throw error;

        if (!workspace) {
          toast.error("Workspace not found");
          navigate("/workspaces");
          return;
        }

        // Verify user is a member of this workspace
        const { data: membership, error: membershipError } = await supabase
          .from("workspace_members")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("user_id", session.session.user.id)
          .single();

        if (membershipError || !membership) {
          toast.error("You don't have access to this workspace");
          navigate("/workspaces");
          return;
        }

        setWorkspace(workspace);
      } catch (error) {
        console.error("Error fetching workspace:", error);
        toast.error("Failed to load workspace");
        navigate("/workspaces");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceSlug, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <Outlet context={{ workspace }} />
    </DashboardLayout>
  );
};

export default WorkspaceLayout;