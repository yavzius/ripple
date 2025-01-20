import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
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
                <Route path="/" element={<Navigate to="/workspaces" replace />} />
                <Route path="/auth" element={<Navigate to="/workspaces" replace />} />
                <Route path="/workspaces" element={<Workspaces />} />
                <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
                
                {/* Workspace-specific routes */}
                <Route path="/:workspaceSlug" element={<WorkspaceLayout />}>
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