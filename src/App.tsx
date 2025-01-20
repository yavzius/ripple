import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Index from "./pages/Index";
import TicketsPage from "./pages/Tickets";
import TicketDetail from "./pages/TicketDetail";
import Workspaces from "./pages/Workspaces";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import KnowledgeBase from "./pages/KnowledgeBase";
import DocumentDetail from "./pages/DocumentDetail";
import Training from "./pages/Training";
import TrainingCardDetail from "./pages/TrainingCardDetail";
import TrainingSession from "./pages/TrainingSession";
import Analytics from "./pages/Analytics";
import Updates from "./pages/Updates";
import Settings from "./pages/Settings";
import CustomerPortal from "./pages/CustomerPortal";
import WorkspaceLayout from "./components/layout/WorkspaceLayout";
import Auth from "./pages/Auth";
import { Skeleton } from "@/components/ui/skeleton";

const queryClient = new QueryClient();

const InitialLoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="space-y-4 w-[300px]">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [defaultWorkspace, setDefaultWorkspace] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isAuthed = !!session;
      setIsAuthenticated(isAuthed);

      if (isAuthed && session) {
        try {
          const { data: workspaces, error } = await supabase
            .from('workspace_members')
            .select('workspaces:workspaces(slug)')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true })
            .maybeSingle();

          if (error) {
            console.error('Error fetching default workspace:', error);
            toast("Error loading workspace");
          } else if (workspaces?.workspaces?.slug) {
            setDefaultWorkspace(workspaces.workspaces.slug);
          }
        } catch (error) {
          console.error('Error fetching default workspace:', error);
        }
      }
      setIsLoading(false);
    });

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const isAuthed = !!session;
      setIsAuthenticated(isAuthed);

      if (isAuthed && session) {
        try {
          const { data: workspaces, error } = await supabase
            .from('workspace_members')
            .select('workspaces:workspaces(slug)')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true })
            .maybeSingle();

          if (error) {
            console.error('Error fetching default workspace:', error);
            toast("Error loading workspace");
          } else if (workspaces?.workspaces?.slug) {
            setDefaultWorkspace(workspaces.workspaces.slug);
          }
        } catch (error) {
          console.error('Error fetching default workspace:', error);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <InitialLoadingState />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {!isAuthenticated ? (
              <>
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<Navigate to="/auth" replace />} />
              </>
            ) : (
              <>
                <Route 
                  path="/" 
                  element={
                    defaultWorkspace ? 
                      <Navigate to={`/${defaultWorkspace}/dashboard`} replace /> : 
                      <Navigate to="/workspaces" replace />
                  } 
                />
                <Route path="/auth" element={<Navigate to="/" replace />} />
                <Route path="/workspaces" element={<Workspaces />} />
                <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
                
                {/* Workspace-specific routes */}
                <Route path="/:workspaceSlug" element={<WorkspaceLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Index />} />
                  <Route path="tickets" element={<TicketsPage />} />
                  <Route path="tickets/:id" element={<TicketDetail />} />
                  <Route path="knowledge" element={<KnowledgeBase />} />
                  <Route path="knowledge/:id" element={<DocumentDetail />} />
                  <Route path="training" element={<Training />} />
                  <Route path="training/:id" element={<TrainingCardDetail />} />
                  <Route path="training/session" element={<TrainingSession />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="updates" element={<Updates />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="customer-portal" element={<CustomerPortal />} />
                </Route>
              </>
            )}
          </Routes>
        </BrowserRouter>
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;