
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/integration/AuthForm';
import IntegrationForm from '@/components/integration/IntegrationForm';
import StatusMessage from '@/components/integration/StatusMessage';

const IntegratePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setSuccessMessage('Authentication successful! You can now connect your ActiveCampaign account.');
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
                
                <IntegrationForm />
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Don't have an account yet?{' '}
              <Button variant="link" className="p-0" onClick={() => navigate('/register')}>
                Register first
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default IntegratePage;
