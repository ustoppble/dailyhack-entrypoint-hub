
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Index from './pages/Index';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import ConfirmationPage from '@/pages/ConfirmationPage';
import HomePage from '@/pages/HomePage';
import AgentsPage from '@/pages/AgentsPage';
import IntegratePage from '@/pages/IntegratePage';
import AgentCentralPage from '@/pages/AgentCentralPage';
import AgentListsPage from '@/pages/AgentListsPage';
import ListEmailsPage from '@/pages/ListEmailsPage';
import EmailPlannerPage from '@/pages/EmailPlannerPage';
import KnowledgeBasePage from '@/pages/KnowledgeBasePage';
import OffersPage from '@/pages/OffersPage';
import OfferEditPage from '@/pages/OfferEditPage';
import EmailViewPage from '@/pages/EmailViewPage';
import NotFound from '@/pages/NotFound';
import AgentSettingsPage from '@/pages/AgentSettingsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="light" storageKey="lovable-theme">
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/confirmation" element={<ConfirmationPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/agents/integrate" element={<IntegratePage />} />
                <Route path="/agents/:agentName/central" element={<AgentCentralPage />} />
                <Route path="/agents/:agentName/lists" element={<AgentListsPage />} />
                <Route path="/agents/:agentName/lists/:listId/emails" element={<ListEmailsPage />} />
                <Route path="/agents/:agentName/planner" element={<EmailPlannerPage />} />
                <Route path="/agents/:agentName/kb" element={<KnowledgeBasePage />} />
                <Route path="/agents/:agentName/offers" element={<OffersPage />} />
                <Route path="/agents/:agentName/offers/new" element={<OfferEditPage />} />
                <Route path="/agents/:agentName/offers/:offerId/edit" element={<OfferEditPage />} />
                <Route path="/agents/:agentName/emails/:emailId" element={<EmailViewPage />} />
                <Route path="/agents/:agentName/settings" element={<AgentSettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
            <Toaster />
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
