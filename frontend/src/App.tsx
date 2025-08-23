import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Form from "./pages/Form";
import Preview from "./pages/Preview";
import Success from "./pages/Success";
import Error from "./pages/Error";
import NotFound from "./pages/NotFound";
import PremiumResult from "./components/PremiumResult";
import PremiumResultLoader from "./components/PremiumResultLoader";

const queryClient = new QueryClient();

// Create a wrapper component to handle route changes
const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Update dataLayer when route changes
    window.dataLayer?.push({
      event: 'pageview',
      page: {
        path: location.pathname,
        title: document.title,
        url: window.location.href
      }
    });
  }, [location]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteChangeTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/form" element={<Form />} />
          <Route path="/preview/:sessionId" element={<Preview />} />
          <Route path="/success/:sessionId" element={<Success />} />
          <Route path="/error" element={<Error />} />
          <Route path="/premium-result/:sessionId" element={<PremiumResultLoader />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
