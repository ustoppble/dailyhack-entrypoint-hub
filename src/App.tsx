
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import AgentsPage from "./pages/AgentsPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import ListsPage from "./pages/ListsPage";
import NotFound from "./pages/NotFound";
import AgentCentralPage from "./pages/AgentCentralPage";
import AgentListsPage from "./pages/AgentListsPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import EmailPlannerPage from "./pages/EmailPlannerPage";
import EmailViewPage from "./pages/EmailViewPage";
import ListEmailsPage from "./pages/ListEmailsPage";
import FetchListsPage from "./pages/FetchListsPage";

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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/confirmation" element={<ConfirmationPage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/lists/:integrationId" element={<ListsPage />} />
              <Route path="/lists/fetch/:agentName" element={<FetchListsPage />} />
              <Route path="/agents/:agentName/central" element={<AgentCentralPage />} />
              <Route path="/agents/:agentName/lists" element={<AgentListsPage />} />
              <Route path="/agents/:agentName/knowledge" element={<KnowledgeBasePage />} />
              <Route path="/agents/:agentName/email-planner" element={<EmailPlannerPage />} />
              <Route path="/agents/:agentName/list-emails/:listId" element={<ListEmailsPage />} />
              <Route path="/email/:emailId" element={<EmailViewPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
