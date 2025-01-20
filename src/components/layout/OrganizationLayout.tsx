import { useEffect, useState } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "./DashboardLayout";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

const OrganizationLayout = () => {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .eq("slug", orgSlug)
          .single();

        if (error) throw error;

        if (!data) {
          toast.error("Organization not found");
          navigate("/organizations");
          return;
        }

        setOrganization(data);
      } catch (error) {
        console.error("Error fetching organization:", error);
        toast.error("Failed to load organization");
        navigate("/organizations");
      } finally {
        setLoading(false);
      }
    };

    if (orgSlug) {
      fetchOrganization();
    }
  }, [orgSlug, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <Outlet context={{ organization }} />
    </DashboardLayout>
  );
};

export default OrganizationLayout;