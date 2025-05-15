
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyActiveCampaignCredentials, updateActiveCampaignIntegration } from '@/lib/api-service';
import { validateActiveCampaignUrl } from '@/lib/validation';
import { useAuth } from '@/contexts/AuthContext';
import StatusMessage from './StatusMessage';

const integrationFormSchema = z.object({
  apiUrl: z.string()
    .min(1, { message: "API URL is required" })
    .refine(url => validateActiveCampaignUrl(url), {
      message: "API URL must be a valid ActiveCampaign URL (e.g., youraccount.api-us1.com or youraccount.activehosted.com)"
    }),
  apiToken: z.string().min(5, { message: "API token is required" }),
});

type IntegrationFormValues = z.infer<typeof integrationFormSchema>;

const IntegrationForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);

  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationFormSchema),
    defaultValues: {
      apiUrl: '',
      apiToken: '',
    },
  });

  const formatApiUrl = (url: string) => {
    // Ensure URL has proper format
    let formattedUrl = url.trim();
    
    // Check if URL starts with http/https
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    // Clean trailing slashes
    if (formattedUrl.endsWith('/')) {
      formattedUrl = formattedUrl.slice(0, -1);
    }
    
    // Convert activehosted.com to api-us1.com format if needed
    if (formattedUrl.includes('activehosted.com')) {
      const accountName = formattedUrl.split('.')[0].split('//')[1];
      formattedUrl = `https://${accountName}.api-us1.com`;
    }
    
    return formattedUrl;
  };

  const handleSubmit = async (data: IntegrationFormValues) => {
    setIsLoading(true);
    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');
    setIsNetworkError(false);
    
    try {
      console.log('Integration form submitted with data:', { 
        apiUrl: data.apiUrl, 
        apiToken: data.apiToken.substring(0, 5) + '***' 
      });
      
      if (!user) {
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

      // Format the API URL correctly
      const formattedApiUrl = formatApiUrl(data.apiUrl);
      console.log('Formatted API URL:', formattedApiUrl);
      
      // Verify ActiveCampaign credentials
      console.log('Verifying ActiveCampaign credentials...');
      const verificationResult = await verifyActiveCampaignCredentials(formattedApiUrl, data.apiToken);
      
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
        email: user.email,
        apiUrl: formattedApiUrl,
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
      setIsNetworkError(!!error.message?.includes('network') || error.code === 'ERR_NETWORK');
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
    <>
      <StatusMessage 
        error={errorMessage} 
        success={successMessage} 
        isNetworkError={isNetworkError} 
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    Format: https://your-account.api-us1.com or https://your-account.activehosted.com
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
    </>
  );
};

export default IntegrationForm;
