import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import Maintenance from "./pages/Maintenance.tsx";
import Services from "./pages/Services.tsx";
import Book from "./pages/Book.tsx";
import Contact from "./pages/Contact.tsx";
import Dvla from "./pages/Dvla.tsx";
import About from "./pages/About.tsx";
import Reviews from "./pages/Reviews.tsx";
import Auth from "./pages/Auth.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Profile from "./pages/Profile.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminAppointments from "./pages/admin/AdminAppointments.tsx";
import AdminReviews from "./pages/admin/AdminReviews.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminNotifications from "./pages/admin/AdminNotifications.tsx";
import AdminChatbot from "./pages/admin/AdminChatbot.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const MaintenanceManager = ({ children }: { children: React.ReactNode }) => {
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from("clinic_settings" as any) as any)
          .select("maintenance_mode")
          .limit(1);
        
        if (data && data.length > 0) {
          const isMaint = !!data[0].maintenance_mode;
          console.log("Maintenance mode check:", isMaint);
          setMaintenance(isMaint);
        } else {
          setMaintenance(false);
        }
      } catch (e) {
        console.error("Failed to check maintenance mode:", e);
        setMaintenance(false);
      }
    };
    check();

    // Subscribe to changes
    const sub = supabase.channel(`maintenance-channel-${Date.now()}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'clinic_settings' 
      }, (payload) => {
        console.log("Maintenance mode updated via Realtime:", payload.new.maintenance_mode);
        setMaintenance(!!payload.new.maintenance_mode);
      })
      .subscribe();
    
    return () => { supabase.removeChannel(sub); };
  }, []);

  if (maintenance === null) return null; // Wait for first check
  
  const isAdminPath = location.pathname.startsWith("/admin");
  if (maintenance && !isAdminPath) {
    return <Maintenance />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MaintenanceManager>
          <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/book" element={<Book />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dvla" element={<Dvla />} />
          <Route path="/about" element={<About />} />
          <Route path="/reviews" element={<Reviews />} />

          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminOverview /></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute requireAdmin><AdminAppointments /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><AdminNotifications /></ProtectedRoute>} />
          <Route path="/admin/chatbot" element={<ProtectedRoute requireAdmin><AdminChatbot /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />

          </Routes>
        </MaintenanceManager>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
