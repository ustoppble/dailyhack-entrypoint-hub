
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AuthForm from '@/components/integration/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserIntegrations } from '@/lib/api/integration';

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/integrate');
    return null;
  }

  const handleAuthSuccess = async (userId: string) => {
    setIsChecking(true);
    
    try {
      // Check if user has any agents
      const userIntegrations = await fetchUserIntegrations(userId);
      
      if (userIntegrations.length > 0) {
        // User has agents, redirect to the first one's central page
        const firstAgent = userIntegrations[0];
        toast({
          title: 'Login successful!',
          description: 'Redirecting to your agent dashboard.',
        });
        navigate(`/agents/${firstAgent.api}/central`);
      } else {
        // No agents, redirect to integrate page
        toast({
          title: 'Login successful!',
          description: 'Welcome back to DailyHack.',
        });
        navigate('/integrate');
      }
    } catch (error) {
      console.error('Error checking user integrations:', error);
      // If there's an error fetching integrations, default to the integrate page
      toast({
        title: 'Login successful!',
        description: 'Welcome back to DailyHack.',
      });
      navigate('/integrate');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Sign in to your DailyHack account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm onAuthSuccess={handleAuthSuccess} />
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Button variant="link" className="p-0" onClick={() => navigate('/register')}>
                Register here
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
