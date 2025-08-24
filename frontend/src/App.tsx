import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

// Import our new Tiare components
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Onboarding from "./pages/auth/Onboarding";
import Dashboard from "./pages/dashboard/Dashboard";
import BillingInterface from "./pages/billing/BillingInterface";
import CreatePatient from "./pages/patients/CreatePatient";
import MainLayout from "./components/layout/MainLayout";

// Placeholder components for new routes
const AppointmentsPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">📅 Gestión de Citas</h1>
      <p className="text-gray-600 mb-6">Esta funcionalidad estará disponible próximamente</p>
      <button 
        onClick={() => window.history.back()} 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Volver
      </button>
    </div>
  </div>
);

const BillingPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">💰 Gestión de Facturación</h1>
      <p className="text-gray-600 mb-6">Esta funcionalidad estará disponible próximamente</p>
      <button 
        onClick={() => window.history.back()} 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Volver
      </button>
    </div>
  </div>
);

const CreateAppointmentPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">📅 Crear Nueva Cita</h1>
      <p className="text-gray-600 mb-6">Esta funcionalidad estará disponible próximamente</p>
      <button 
        onClick={() => window.history.back()} 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Volver
      </button>
    </div>
  </div>
);

const CreateBillingPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">💰 Crear Nueva Factura</h1>
      <p className="text-gray-600 mb-6">Esta funcionalidad estará disponible próximamente</p>
      <button 
        onClick={() => window.history.back()} 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Volver
      </button>
    </div>
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Helmet>
            <title>Tiare - Gestión de Práctica Médica</title>
            <meta name="description" content="Sistema integral de gestión para prácticas de salud mental" />
          </Helmet>
          
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />
            
            {/* Protected routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="patients/create" element={<CreatePatient />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="appointments/create" element={<CreateAppointmentPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="billing/create" element={<CreateBillingPage />} />
              <Route path="facturacion" element={<BillingInterface />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
