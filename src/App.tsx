import DesigningPortal from "./pages/DesigningPortal";
import CertificateTemplates from "./pages/CertificateTemplates";
import IdCardPage from "./pages/IdCardPage";
import QrScanPage from "./pages/QrScanPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SaasLanding from "./pages/SaasLanding";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SaasLanding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<UserProfile />} />
          
          <Route path="/dashboard" element={<Landing />} />
          <Route path="/dashboard/manage" element={<Index />} />
          <Route path="/dashboard/certificates" element={<CertificateTemplates />} />
          <Route path="/dashboard/designer" element={<DesigningPortal />} />
          <Route path="/dashboard/id-cards" element={<IdCardPage />} />
          <Route path="/dashboard/qr-scan" element={<QrScanPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;