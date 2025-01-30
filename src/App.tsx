import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from '@supabase/supabase-js';
import { useWorkspace } from "@/hooks/use-workspace";
import TicketsPage from "@/features/tickets/pages/Tickets";
import NewTicket from "@/features/tickets/pages/NewTicket";
import TicketDetail from "@/features/tickets/pages/TicketDetail";
import KnowledgeBase from "@/features/knowledge-base/pages/KnowledgeBase";
import DocumentDetail from "@/features/knowledge-base/pages/DocumentDetail";
import Settings from "@/features/settings/pages/Settings";
import CustomerPortal from "@/features/customer-dashboard/pages/CustomerPortal";
import WorkspaceLayout from "@/components/layout/WorkspaceLayout";
import Auth from "@/features/auth/pages/Auth";
import SignUp from "@/features/auth/pages/SignUp";
import { Skeleton } from "@/components/ui/skeleton";
import NewCustomerCompany from "@/features/customers/pages/NewCustomerCompany";
import Companies from "@/features/customers/pages/Companies";
import CompanyDetail from "@/features/customers/pages/CompanyDetail";
import NewContact from "@/features/customers/pages/NewContact";
import Inbox from "@/features/inbox/pages/Inbox";
import Landing from "@/pages/Landing";
import BrandChat from "@/features/customer-dashboard/pages/BrandChat";
import ImportPage from "@/features/knowledge-base/pages/ImportPage";
import Orders from "@/features/orders/pages/Orders";
import CreateOrder from "@/features/orders/pages/CreateOrder";
import EditOrder from "@/features/orders/pages/EditOrder";
import OrderView from "@/features/orders/pages/OrderView";

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
          <Route path="/chat/:brandSlug" element={<BrandChat />} />
          <Route path="/auth" element={
            isAuthenticated ? <Navigate to="/inbox" replace /> : <Auth />
          } />
          <Route path="/sign-up" element={
            isAuthenticated ? <Navigate to="/inbox" replace /> : <SignUp />
          } />
          {isAuthenticated ? (
            <Route element={<WorkspaceLayout />}>
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/inbox/:conversationId" element={<Inbox />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/new" element={<NewTicket />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/knowledge-base/import" element={<ImportPage />} />
              <Route path="/knowledge-base/:id" element={<DocumentDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/new" element={<NewCustomerCompany />} />
              <Route path="/companies/:id" element={<CompanyDetail />} />
              <Route path="/companies/:id/contacts/new" element={<NewContact />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/new" element={<CreateOrder />} />
              <Route path="/orders/:orderId" element={<OrderView />} />
              <Route path="/orders/:orderId/edit" element={<EditOrder />} />
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