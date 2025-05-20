
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from "@/components/ui/toaster";
import Layout from '@/components/Layout';
import { AuthProvider } from '@/contexts/AuthContext';

// Import pages
import HomePage from './pages/HomePage';
import IntegratePage from './pages/IntegratePage';
import AgentsPage from './pages/AgentsPage';
import AgentCentralPage from './pages/AgentCentralPage';
import AgentListsPage from './pages/AgentListsPage';
import FetchListsPage from './pages/FetchListsPage';
import ListsPage from './pages/ListsPage';
import EmailPlannerPage from './pages/EmailPlannerPage';
import ListEmailsPage from './pages/ListEmailsPage';
import EmailViewPage from './pages/EmailViewPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ConfirmationPage from './pages/ConfirmationPage';
import NotFound from './pages/NotFound';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import OffersPage from './pages/OffersPage';
import OfferEditPage from './pages/OfferEditPage';
import AgentSettingsPage from './pages/AgentSettingsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><Outlet /></Layout>}>
            <Route index element={<HomePage />} />
            <Route path="integrate" element={<IntegratePage />} />
            {/* Consolidate "agents" to use the same IntegratePage */}
            <Route path="agents" element={<AgentsPage />} />
            <Route path="agents/:agentName/central" element={<AgentCentralPage />} />
            <Route path="agents/:agentName/lists" element={<AgentListsPage />} />
            <Route path="agents/:agentName/fetch-lists" element={<FetchListsPage />} />
            <Route path="agents/:agentName/email-lists" element={<ListsPage />} />
            <Route path="agents/:agentName/planner" element={<EmailPlannerPage />} />
            <Route path="agents/:agentName/list/:listId/emails" element={<ListEmailsPage />} />
            <Route path="agents/:agentName/email/:emailId" element={<EmailViewPage />} />
            <Route path="email/:emailId" element={<EmailViewPage />} />
            <Route path="agents/:agentName/kb" element={<KnowledgeBasePage />} />
            <Route path="agents/:agentName/settings" element={<AgentSettingsPage />} />
            
            {/* Offers management routes */}
            <Route path="agents/:agentName/offers" element={<OffersPage />} />
            <Route path="agents/:agentName/offers/edit/:offerId" element={<OfferEditPage />} />
            
            {/* Authentication routes */}
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="confirmation" element={<ConfirmationPage />} />
            
            {/* Handle 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
