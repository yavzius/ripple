import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';
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
import SignUp from "./pages/SignUp";
import { Skeleton } from "@/components/ui/skeleton";
import NewCustomerCompany from "./pages/NewCustomerCompany";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import NewContact from "./pages/NewContact";
import Inbox from "./pages/Inbox";
import Landing from "./pages/Landing";

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
  const { clear: clearWorkspace } = useWorkspace();

  useEffect(() => {
    async function handleSession(session: Session | null) {
      const isAuthed = !!session;
      setIsAuthenticated(isAuthed);

      if (!isAuthed) {
        clearWorkspace();
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
  }, [clearWorkspace]);

  if (isLoading) {
    return <InitialLoadingState />;
  }

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/customer" element={<CustomerPortal />} />
          <Route path="/chat/:workspaceId" element={<ChatbotPortal />} />
          <Route path="/auth" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />
          } />
          <Route path="/sign-up" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignUp />
          } />
          {isAuthenticated ? (
            <Route element={<WorkspaceLayout />}>
              <Route path="/dashboard" element={<Index />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/inbox/:conversationId" element={<Inbox />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/new" element={<NewTicket />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/knowledge-base/:id" element={<DocumentDetail />} />
              <Route path="/training" element={<Training />} />
              <Route path="/training/:id" element={<TrainingCardDetail />} />
              <Route path="/training/session/:id" element={<TrainingSession />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/new" element={<NewCustomerCompany />} />
              <Route path="/companies/:id" element={<CompanyDetail />} />
              <Route path="/companies/:id/contacts/new" element={<NewContact />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/auth" replace />} />
          )}
        </Routes>
      </BrowserRouter>
      <Sonner />
    </TooltipProvider>
  );
}

export default App;