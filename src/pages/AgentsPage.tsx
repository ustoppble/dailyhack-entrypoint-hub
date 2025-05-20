import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/integration/AuthForm';
import IntegrationForm from '@/components/integration/IntegrationForm';
import StatusMessage from '@/components/integration/StatusMessage';
import { useToast } from '@/hooks/use-toast';
import IntegrationGrid from '@/components/lists/IntegrationGrid';
import { fetchUserIntegrations } from '@/lib/api/integration';

const AgentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [attemptedUrl, setAttemptedUrl] = useState('');
  const [responseDetails, setResponseDetails] = useState<{status?: number, data?: any}>();
  const [integrations, setIntegrations] = useState<{id: string, api: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if mode=add is in the URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const initialShowNewForm = queryParams.get('mode') === 'add';
  const [showNewForm, setShowNewForm] = useState(initialShowNewForm);

  useEffect(() => {
    const loadIntegrations = async () => {
      if (user && user.id) {
        try {
          setIsLoading(true);
          const userIntegrations = await fetchUserIntegrations(String(user.id));
          setIntegrations(userIntegrations);
          // Only show the form if no integrations exist or if mode=add
          setShowNewForm(initialShowNewForm || userIntegrations.length === 0);
        } catch (error) {
          console.error('Failed to load integrations:', error);
          toast({
            title: "Error loading integrations",
            description: "Could not load your connected agents.",
            variant: "destructive",
          });
          // Show form if we couldn't load integrations
          setShowNewForm(true);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (isAuthenticated) {
      loadIntegrations();
    }
  }, [user, isAuthenticated, toast, initialShowNewForm]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setErrorMessage('');
    setIsNetworkError(false);
    setAttemptedUrl('');
    setResponseDetails(undefined);
    setSuccessMessage('Authentication successful! You can now connect your ActiveCampaign account.');
  };

  const handleIntegrationError = (
    message: string, 
    isNetwork: boolean,
    url?: string,
    details?: {status?: number, data?: any}
  ) => {
    setErrorMessage(message);
    setIsNetworkError(isNetwork);
    setAttemptedUrl(url || '');
    setResponseDetails(details);
    setSuccessMessage('');
    
    if (isNetwork) {
      toast({
        title: "Network Connection Error",
        description: "Unable to reach ActiveCampaign servers. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const handleIntegrationSuccess = (message: string) => {
    setErrorMessage('');
    setIsNetworkError(false);
    setAttemptedUrl('');
    setResponseDetails(undefined);
    setSuccessMessage(message);
  };

  const handleAddNew = () => {
    setShowNewForm(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {!isAuthenticated && !user ? (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Connect ActiveCampaign Agent</CardTitle>
              <CardDescription className="text-center">
                Integrate your ActiveCampaign agent with DailyHack
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForm onAuthSuccess={handleAuthSuccess} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center">Your ActiveCampaign Agents</h1>
            <p className="text-center text-gray-500 mt-2">
              Manage your connected ActiveCampaign agents
            </p>
          </div>
          
          {showNewForm ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  {integrations.length === 0 ? "Connect New Agent" : "Add Another Agent"}
                </CardTitle>
                <CardDescription className="text-center">
                  Integrate your ActiveCampaign agent with DailyHack
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatusMessage 
                  error={errorMessage} 
                  success={successMessage} 
                  isNetworkError={isNetworkError}
                  attemptedUrl={attemptedUrl}
                  responseDetails={responseDetails} 
                />
                
                {user && (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md">
                    <p className="text-sm">Logged in as: <strong>{user.email}</strong></p>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <IntegrationForm 
                  onError={handleIntegrationError}
                  onSuccess={handleIntegrationSuccess}
                />
              </CardContent>
              {integrations.length > 0 && (
                <CardFooter className="flex justify-center">
                  <Button variant="outline" onClick={() => setShowNewForm(false)}>
                    Back to My Agents
                  </Button>
                </CardFooter>
              )}
            </Card>
          ) : (
            <IntegrationGrid 
              integrations={integrations} 
              onAddNew={handleAddNew} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AgentsPage;
