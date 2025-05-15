
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyActiveCampaignCredentials, updateActiveCampaignIntegration } from '@/lib/api-service';
import { validateActiveCampaignUrl } from '@/lib/validation';
import { useAuth } from '@/contexts/AuthContext';

const integrationFormSchema = z.object({
  apiUrl: z.string()
    .min(1, { message: "API URL is required" })
    .refine(url => validateActiveCampaignUrl(url), {
      message: "API URL must be a valid ActiveCampaign URL (e.g., youraccount.api-us1.com or youraccount.activehosted.com)"
    }),
  apiToken: z.string().min(5, { message: "API token is required" }),
});

type IntegrationFormValues = z.infer<typeof integrationFormSchema>;

interface IntegrationFormProps {
  onError?: (message: string, isNetworkError: boolean) => void;
  onSuccess?: (message: string) => void;
}

const IntegrationForm = ({ onError, onSuccess }: IntegrationFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastAttemptedData, setLastAttemptedData] = useState<IntegrationFormValues | null>(null);

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

  const handleRetry = async () => {
    if (!lastAttemptedData) return;
    
    setIsRetrying(true);
    await handleSubmit(lastAttemptedData);
    setIsRetrying(false);
  };

  const handleSubmit = async (data: IntegrationFormValues) => {
    setIsLoading(true);
    setIsVerifying(true);
    setLastAttemptedData(data);
    
    try {
      console.log('Integration form submitted with data:', { 
        apiUrl: data.apiUrl, 
        apiToken: data.apiToken.substring(0, 5) + '***' 
      });
      
      if (!user) {
        const errorMsg = 'You must be authenticated to connect your ActiveCampaign account';
        onError?.(errorMsg, false);
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
        const errorMsg = `ActiveCampaign verification failed: ${verificationResult.message || 'Unknown error'}`;
        onError?.(errorMsg, verificationResult.isNetworkError || false);
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
      onSuccess?.('ActiveCampaign credentials verified successfully');
      
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
        const errorMsg = 'Integration failed. An error occurred while updating your integration details.';
        onError?.(errorMsg, false);
        toast({
          title: "Integration failed",
          description: "An error occurred while updating your integration details.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Integration error:', error);
      const isNetworkError = !!error.message?.includes('network') || error.code === 'ERR_NETWORK';
      const errorMsg = error.message || "An unexpected error occurred";
      
      onError?.(errorMsg, isNetworkError);
      toast({
        title: isNetworkError ? "Network Connection Error" : "Integration failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  return (
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
        
        <div className="flex flex-col space-y-2">
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
          
          {lastAttemptedData && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleRetry}
              disabled={isRetrying || isLoading}
            >
              {isRetrying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Retry Connection
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default IntegrationForm;
