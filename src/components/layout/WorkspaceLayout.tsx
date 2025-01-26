import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "./DashboardLayout";

const WorkspaceLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let isSubscribed = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isSubscribed && !session) {
          navigate("/auth", { replace: true });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth", { replace: true });
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default WorkspaceLayout;