import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';
import { queryClient } from "@/lib/query-client";
import { useWorkspace } from "@/hooks/use-workspace";
import Index from "./pages/Index";
import TicketsPage from "./pages/Tickets";
import NewTicket from "./pages/NewTicket";
import TicketDetail from "./pages/TicketDetail";
import KnowledgeBase from "./pages/KnowledgeBase";
import DocumentDetail from "./pages/DocumentDetail";
import Training from "./pages/Training";
import TrainingCardDetail from "./pages/TrainingCardDetail";
import TrainingSession from "./pages/TrainingSession";
import Analytics from "./pages/Analytics";
import Updates from "./pages/Updates";
import Settings from "./pages/Settings";
import CustomerPortal from "./pages/CustomerPortal";
import ChatbotPortal from "./pages/ChatbotPortal";
import WorkspaceLayout from "./components/layout/WorkspaceLayout";
import Auth from "./pages/Auth";
import CRM from "./pages/Companies";
import { Skeleton } from "@/components/ui/skeleton";
import Customers from "./pages/Companies";
import NewCustomerCompany from "./pages/NewCustomerCompany";
import CustomerDetail from "./pages/CompanyDetail";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import NewContact from "./pages/NewContact";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function handleSession(session: Session | null) {
      const isAuthed = !!session;
      setIsAuthenticated(isAuthed);

      if (!isAuthed) {
        // Clear all queries when logging out
        queryClient.clear();
      }

      if (isAuthed && session) {
        setIsLoading(false);
      }
      setIsLoading(false);
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleSession(session);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <InitialLoadingState />;
  }

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/auth" element={<Auth />} />
              <Route path="/customer" element={<CustomerPortal />} />
              <Route path="/chat/:workspaceId" element={<ChatbotPortal />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </>
          ) : (
            <>
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" replace />} 
              />
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="/customer" element={<CustomerPortal />} />
              <Route path="/chat/:workspaceId" element={<ChatbotPortal />} />
              
              {/* Main routes */}
              <Route element={<WorkspaceLayout />}>
                <Route path="/dashboard" element={<Index />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/tickets/new" element={<NewTicket />} />
                <Route path="/tickets/:id" element={<TicketDetail />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/knowledge-base/:id" element={<DocumentDetail />} />
                <Route path="/training" element={<Training />} />
                <Route path="/training/cards/:id" element={<TrainingCardDetail />} />
                <Route path="/training/session" element={<TrainingSession />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/updates" element={<Updates />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/new" element={<NewCustomerCompany />} />
                <Route path="/companies/:id" element={<CompanyDetail />} />
                <Route path="/companies/:id/contacts/new" element={<NewContact />} />
              </Route>
            </>
          )}
        </Routes>
        <Sonner />
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;