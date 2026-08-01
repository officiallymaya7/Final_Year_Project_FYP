import DesignPackageEditor from "./pages/DesignPackageEditor";
import DesignPackageCreator from "./pages/DesignPackageCreator";
import DesignStudio from "./pages/DesignStudio.tsx";
import DesignEditor from "./pages/DesignEditor.tsx";
import MyDesigns from "./pages/MyDesigns.tsx";
import PaymentPage from "@/pages/Paymentpage";
import AdminOrganizers from "@/admin/pages/AdminOrganizers";
import AdminEvents from "@/admin/pages/AdminEvents";
import { ChatHistoryProvider } from "@/context/ChatHistoryContext";
import DesigningPortal from "./pages/DesigningPortal";
import CertificateTemplates from "./pages/CertificateTemplates";
import IdCardPage from "./pages/IdCardPage";
import EventWorkspace from "./pages/EventWorkspace";
import EventParticipants from "./pages/EventParticipants";
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
import ContentGeneration from "./pages/ContentGeneration";
import EmailAutomation from "./pages/EmailAutomation";

// Admin panel imports
import { AdminAuthProvider } from "@/admin/context/AdminAuthContext";
import AdminLogin from "@/admin/pages/AdminLogin";
import AdminLayout from "@/admin/components/AdminLayout";
import AdminDashboard from "@/admin/pages/AdminDashboard";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ChatHistoryProvider>
      <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SaasLanding />} />
          

          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<UserProfile />} />

          <Route path="/dashboard" element={<Landing />} />
          <Route path="/dashboard/manage" element={<Index />} />
          <Route path="/dashboard/certificates" element={<CertificateTemplates />} />
          <Route path="/dashboard/designer" element={<DesigningPortal />} />
          <Route path="/dashboard/id-cards" element={<IdCardPage />} />
          <Route path="/dashboard/qr-scan" element={<QrScanPage />} />
          <Route path="/dashboard/event/:eventId" element={<EventWorkspace />} />
          <Route path="/dashboard/event/:eventId/participants" element={<EventParticipants />} />
          <Route path="/dashboard/content-generation" element={<ContentGeneration />} />
          <Route path="/dashboard/email-automation" element={<EmailAutomation />} />

          {/* Design Studio (new) */}
          <Route path="/dashboard/design" element={<DesignStudio />} />
          <Route path="/dashboard/design/my" element={<MyDesigns />} />
          <Route path="/dashboard/design/editor/:templateId" element={<DesignEditor />} />
          <Route path="/dashboard/design/saved/:designId" element={<DesignEditor />} />
          <Route path="/dashboard/event/:eventId/design" element={<DesignPackageCreator />} />
          <Route path="/dashboard/event/:eventId/design/editor" element={<DesignPackageEditor />} />

          {/* Admin Panel Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="organizers" element={<AdminOrganizers />} />
            <Route path="events" element={<AdminEvents />} />
            {/* subscriptions route yahan add hoga (Step 4) */}
            
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AdminAuthProvider>
      </ChatHistoryProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;