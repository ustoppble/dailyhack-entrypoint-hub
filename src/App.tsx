
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import IntegratePage from "./pages/IntegratePage";
import ConfirmationPage from "./pages/ConfirmationPage";
import ListsPage from "./pages/ListsPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";
import MarketingAutomationPage from "./pages/MarketingAutomationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/integrate" element={<IntegratePage />} />
              <Route path="/confirmation" element={<ConfirmationPage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/lists/:integrationId" element={<ListsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/automation" element={<MarketingAutomationPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
