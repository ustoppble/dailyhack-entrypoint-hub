
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

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  apiUrl: z.string().url({ message: "Valid URL is required" })
    .refine(url => validateActiveCampaignUrl(url), {
      message: "API URL must be a valid ActiveCampaign URL"
    }),
  apiToken: z.string().min(5, { message: "API token is required" }),
});

type IntegrationFormValues = z.infer<typeof formSchema>;

const IntegratePage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || '',
      password: '',
      apiUrl: '',
      apiToken: '',
    },
  });

  const onSubmit = async (data: IntegrationFormValues) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      console.log('Form submitted with data:', { ...data, apiToken: '***hidden***' });
      
      // First verify user credentials if not authenticated
      if (!user) {
        console.log('No user in context, authenticating...');
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
      }
      
      // Verify ActiveCampaign credentials
      setIsVerifying(true);
      console.log('Verifying ActiveCampaign credentials...');
      const isValidAC = await verifyActiveCampaignCredentials(data.apiUrl, data.apiToken);
      
      if (!isValidAC) {
        setErrorMessage('ActiveCampaign verification failed. Please check your API URL and token.');
        toast({
          title: "ActiveCampaign verification failed",
          description: "Please check your API URL and token.",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsVerifying(false);
        return;
      }
      
      console.log('ActiveCampaign credentials verified successfully');
      
      // Update integration details
      console.log('Updating integration details...');
      const success = await updateActiveCampaignIntegration({
        email: data.email,
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
              <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-800 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {!user && (
                  <>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                    
                    <Separator className="my-4" />
                  </>
                )}
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
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
                          Format: https://your-account.api-us1.com
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
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
