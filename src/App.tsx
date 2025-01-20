import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import TicketsPage from "./pages/Tickets";
import TicketDetail from "./pages/TicketDetail";
import Organizations from "./pages/Organizations";
import OrganizationDetail from "./pages/OrganizationDetail";
import KnowledgeBase from "./pages/KnowledgeBase";
import DocumentDetail from "./pages/DocumentDetail";
import Training from "./pages/Training";
import TrainingCardDetail from "./pages/TrainingCardDetail";
import TrainingSession from "./pages/TrainingSession";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/organizations/:id" element={<OrganizationDetail />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/knowledge/:id" element={<DocumentDetail />} />
            <Route path="/training" element={<Training />} />
            <Route path="/training/:id" element={<TrainingCardDetail />} />
            <Route path="/training/session" element={<TrainingSession />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </BrowserRouter>
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;