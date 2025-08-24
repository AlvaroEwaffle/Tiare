import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import our new Tiare components
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Onboarding from "./pages/auth/Onboarding";
import Dashboard from "./pages/dashboard/Dashboard";
import BillingInterface from "./pages/billing/BillingInterface";
import CreatePatient from "./pages/patients/CreatePatient";
import MainLayout from "./components/layout/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Simple routing for testing */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<BillingInterface />} />
          <Route path="/patients/create" element={<CreatePatient />} />
          <Route path="/test-layout" element={<MainLayout />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
