
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { validateUserCredentials, verifyActiveCampaignCredentials, updateActiveCampaignIntegration } from '@/lib/api-service';
import { useAuth } from '@/contexts/AuthContext';
import { validateActiveCampaignUrl } from '@/lib/validation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const authFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const integrationFormSchema = z.object({
  apiUrl: z.string()
    .min(1, { message: "API URL is required" })
    .refine(url => validateActiveCampaignUrl(url), {
      message: "API URL must be a valid ActiveCampaign URL (e.g., youraccount.api-us1.com or youraccount.activehosted.com)"
    }),
  apiToken: z.string().min(5, { message: "API token is required" }),
});

type AuthFormValues = z.infer<typeof authFormSchema>;
type IntegrationFormValues = z.infer<typeof integrationFormSchema>;

const IntegratePage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  const authForm = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: user?.email || '',
      password: '',
    },
  });

  const integrationForm = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationFormSchema),
    defaultValues: {
      apiUrl: '',
      apiToken: '',
    },
  });

  const handleAuthSubmit = async (data: AuthFormValues) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      console.log('Auth form submitted with data:', { ...data, password: '***hidden***' });
      
      const authenticatedUser = await validateUserCredentials(data.email, data.password);
      
      if (!authenticatedUser) {
        setErrorMessage('Invalid email or password');
        toast({
          title: "Authentication failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      console.log('User authenticated successfully');
      setUser(authenticatedUser);
      setIsAuthenticated(true);
      
      toast({
        title: "Authentication successful",
        description: "You can now connect your ActiveCampaign account.",
      });
      
    } catch (error: any) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message || "An unexpected error occurred");
      toast({
        title: "Authentication failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegrationSubmit = async (data: IntegrationFormValues) => {
    setIsLoading(true);
    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      console.log('Integration form submitted with data:', { ...data, apiToken: '***hidden***' });
      
      if (!user && !isAuthenticated) {
        setErrorMessage('You must be authenticated to connect your ActiveCampaign account');
        toast({
          title: "Authentication required",
          description: "Please log in first.",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsVerifying(false);
        return;
      }
      
      // Verify ActiveCampaign credentials
      console.log('Verifying ActiveCampaign credentials...');
      const verificationResult = await verifyActiveCampaignCredentials(data.apiUrl, data.apiToken);
      
      if (!verificationResult.success) {
        setErrorMessage(`ActiveCampaign verification failed: ${verificationResult.message || 'Unknown error'}`);
        toast({
          title: "ActiveCampaign verification failed",
          description: verificationResult.message || "Please check your API URL and token.",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsVerifying(false);
        return;
      }
      
      console.log('ActiveCampaign credentials verified successfully');
      setSuccessMessage('ActiveCampaign credentials verified successfully');
      
      // Update integration details
      console.log('Updating integration details...');
      const success = await updateActiveCampaignIntegration({
        email: user?.email || authForm.getValues('email'),
        apiUrl: data.apiUrl,
        apiToken: data.apiToken,
      });
      
      if (success) {
        console.log('Integration successful');
        toast({
          title: "Integration successful!",
          description: "Your ActiveCampaign account has been connected.",
        });
        
        // Redirect to confirmation page
        navigate('/confirmation');
      } else {
        setErrorMessage('Integration failed. An error occurred while updating your integration details.');
        toast({
          title: "Integration failed",
          description: "An error occurred while updating your integration details.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Integration error:', error);
      setErrorMessage(error.message || "An unexpected error occurred");
      toast({
        title: "Integration failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
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
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            {successMessage && (
              <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            
            {!isAuthenticated && !user ? (
              <Form {...authForm}>
                <form onSubmit={authForm.handleSubmit(handleAuthSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <FormField
                      control={authForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={authForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      "Log In"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <>
                {user && (
                  <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md">
                    <p className="text-sm">Logged in as: <strong>{user.email}</strong></p>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <Form {...integrationForm}>
                  <form onSubmit={integrationForm.handleSubmit(handleIntegrationSubmit)} className="space-y-4">
                    <div className="space-y-4">
                      <FormField
                        control={integrationForm.control}
                        name="apiUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ActiveCampaign API URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://your-account.api-us1.com" 
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500 mt-1">
                              Format: https://your-account.api-us1.com or https://your-account.activehosted.com
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={integrationForm.control}
                        name="apiToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ActiveCampaign API Token</FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="Your API token" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isVerifying ? "Verifying..." : "Connecting..."}
                        </>
                      ) : (
                        "Connect Account"
                      )}
                    </Button>
                  </form>
                </Form>
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
