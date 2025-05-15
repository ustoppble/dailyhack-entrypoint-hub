
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { 
  verifyActiveCampaignCredentials, 
  updateActiveCampaignIntegration,
  formatApiUrl,
  extractAccountName 
} from '@/lib/api/integration';
import { useAuth } from '@/contexts/AuthContext';
import FormFields, { integrationFormSchema, IntegrationFormValues } from './FormFields';
import FormActions from './FormActions';
import FormNotice from './FormNotice';

interface IntegrationFormProps {
  onError?: (message: string, isNetworkError: boolean, url?: string, details?: {status?: number, data?: any}) => void;
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
      
      if (!user || !user.id) {
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
      
      // Verify ActiveCampaign credentials (using n8n webhook)
      console.log('Verifying ActiveCampaign credentials via n8n webhook...');
      const verificationResult = await verifyActiveCampaignCredentials(formattedApiUrl, data.apiToken);
      
      if (!verificationResult.success) {
        const errorMsg = `ActiveCampaign verification failed: ${verificationResult.message || 'Unknown error'}`;
        onError?.(
          errorMsg, 
          verificationResult.isNetworkError || false,
          verificationResult.attemptedUrl,
          verificationResult.responseDetails
        );
        toast({
          title: "ActiveCampaign verification failed",
          description: verificationResult.message || "Please check your API URL and token.",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsVerifying(false);
        return;
      }
      
      console.log('ActiveCampaign credentials verified successfully via n8n webhook');
      onSuccess?.('ActiveCampaign credentials verified successfully');
      
      // Get account name for the redirect
      const accountName = extractAccountName(formattedApiUrl);
      
      // Store API credentials in localStorage for later use
      localStorage.setItem('ac_api_url', formattedApiUrl);
      localStorage.setItem('ac_api_token', data.apiToken);
      localStorage.setItem('ac_account_name', accountName);
      
      // Ensure user.id is properly formatted - use it directly as a string without wrapping in array
      const userId = String(user.id);
      console.log('Using user ID for integration:', userId);
      
      // Update integration details
      console.log('Updating integration details...');
      const success = await updateActiveCampaignIntegration({
        userId: userId,
        apiUrl: formattedApiUrl,
        apiToken: data.apiToken,
      });
      
      if (success) {
        console.log('Integration successful');
        toast({
          title: "Integration successful!",
          description: "Your ActiveCampaign account has been connected.",
        });
        
        // Redirect to agent central page
        navigate(`/agents/${accountName}/central`);
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
        <FormFields form={form} />
        <FormNotice />
        <FormActions
          isLoading={isLoading}
          isVerifying={isVerifying}
          isRetrying={isRetrying}
          hasAttempted={!!lastAttemptedData}
          onRetry={handleRetry}
        />
      </form>
    </Form>
  );
};

export default IntegrationForm;

