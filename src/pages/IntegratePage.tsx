
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/integration/AuthForm';
import IntegrationForm from '@/components/integration/IntegrationForm';
import StatusMessage from '@/components/integration/StatusMessage';
import { useToast } from '@/hooks/use-toast';

const IntegratePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [attemptedUrl, setAttemptedUrl] = useState('');
  const [responseDetails, setResponseDetails] = useState<{status?: number, data?: any}>();

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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Connect ActiveCampaign</CardTitle>
            <CardDescription className="text-center">
              Integrate your ActiveCampaign account with DailyHack
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
            
            {!isAuthenticated && !user ? (
              <AuthForm onAuthSuccess={handleAuthSuccess} />
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntegratePage;
