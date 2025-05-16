
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchUserIntegrations } from '@/lib/api/integration';
import { fetchEmailLists, fetchConnectedLists } from '@/lib/api/lists';
import { EmailList } from '@/lib/api/types';

// Import our components
import LoadingState from '@/components/lists/LoadingState';
import ErrorState from '@/components/lists/ErrorState';
import EmptyState from '@/components/lists/EmptyState';
import IntegrationGrid from '@/components/lists/IntegrationGrid';

const ListsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { integrationId } = useParams<{ integrationId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<{id: string, api: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showingForAgent, setShowingForAgent] = useState<string | null>(integrationId || null);
  
  useEffect(() => {
    const loadIntegrations = async () => {
      if (!user) {
        navigate('/agents');
        return;
      }
      
      try {
        const userIntegrations = await fetchUserIntegrations(user.id);
        setIntegrations(userIntegrations);
      } catch (error: any) {
        console.error('Error loading integrations:', error);
        setError(error.message || 'Failed to load ActiveCampaign agents');
        toast({
          title: 'Error loading agents',
          description: error.message || 'Could not load your ActiveCampaign agents.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadIntegrations();
  }, [user, navigate, toast]);
  
  const handleAddNewIntegration = () => {
    navigate('/agents');
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    
    if (error) {
      return <ErrorState error={error} />;
    }
    
    if (integrations.length === 0) {
      return <EmptyState onAddNew={handleAddNewIntegration} />;
    }
    
    return (
      <>
        <IntegrationGrid 
          integrations={integrations} 
          onAddNew={handleAddNewIntegration} 
          agentFilter={showingForAgent}
        />
        <Separator className="my-8" />
      </>
    );
  };

  const pageTitle = showingForAgent 
    ? `Available Lists for ${showingForAgent}` 
    : "Your ActiveCampaign Agents";
  
  const pageDescription = showingForAgent
    ? "Select lists to connect to your agent"
    : "Select an agent to work with or add a new one";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{pageTitle}</CardTitle>
            <CardDescription className="text-center">
              {pageDescription}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListsPage;
