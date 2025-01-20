import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/workspaces" replace />} />
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
          </Routes>
        </BrowserRouter>
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;