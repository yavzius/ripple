import { useEffect, useState } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "./DashboardLayout";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

const WorkspaceLayout = () => {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const { data, error } = await supabase
          .from("workspaces")
          .select("*")
          .eq("slug", workspaceSlug)
          .single();

        if (error) throw error;

        if (!data) {
          toast.error("Workspace not found");
          navigate("/workspaces");
          return;
        }

        setWorkspace(data);
      } catch (error) {
        console.error("Error fetching workspace:", error);
        toast.error("Failed to load workspace");
        navigate("/workspaces");
      } finally {
        setLoading(false);
      }
    };

    if (workspaceSlug) {
      fetchWorkspace();
    }
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