
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { fetchIntegrationByUserAndAgent, verifyActiveCampaignCredentials } from '@/lib/api-service';
import { updateAgentSettings } from '@/lib/api/integration';
import { Settings, ArrowLeft } from 'lucide-react';

// Validation schema for integration settings
const integrationSchema = z.object({
  apiUrl: z.string().url('Must be a valid URL'),
  apiToken: z.string().min(1, 'API Token is required'),
  timezone: z.string().optional(),
  approver: z.boolean().optional(),
});

type IntegrationFormValues = z.infer<typeof integrationSchema>;

const AgentSettingsPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [integrationId, setIntegrationId] = useState<string | null>(null);

  // Initialize form with validation
  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      apiUrl: '',
      apiToken: '',
      timezone: 'UTC',
      approver: false,
    }
  });

  // Available timezones
  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'
  ];

  // Load integration data when component mounts
  useEffect(() => {
    if (user?.id && agentName) {
      loadIntegrationData();
    }
  }, [user, agentName]);

  // Fetch integration data from Airtable
  const loadIntegrationData = async () => {
    if (!user?.id || !agentName) return;
    
    try {
      setIsLoading(true);
      const integration = await fetchIntegrationByUserAndAgent(user.id, agentName);
      
      if (integration) {
        console.log('Loaded integration:', integration);
        setIntegrationId(integration.id);
        
        // Format the API URL for display
        let formattedApiUrl = integration.api;
        if (!formattedApiUrl.startsWith('http')) {
          formattedApiUrl = `https://${formattedApiUrl}.api-us1.com`;
        }
        
        // Set form values
        form.reset({
          apiUrl: formattedApiUrl,
          apiToken: integration.token || '',
          timezone: integration.timezone || 'UTC',
          approver: integration.approver === 1,
        });
      } else {
        toast({
          title: 'Integration not found',
          description: 'Could not find integration details for this agent',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error loading integration:', error);
      toast({
        title: 'Error',
        description: `Failed to load integration data: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission to update integration
  const onSubmit = async (data: IntegrationFormValues) => {
    if (!user?.id || !agentName || !integrationId) {
      toast({
        title: 'Missing Information',
        description: 'User ID, agent name, or integration ID not found',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // First verify the credentials are valid
      const verificationResult = await verifyActiveCampaignCredentials(
        data.apiUrl,
        data.apiToken
      );
      
      if (!verificationResult.success) {
        toast({
          title: 'Verification Failed',
          description: verificationResult.message,
          variant: 'destructive',
        });
        return;
      }
      
      // If verification successful, update the integration record
      const updateSuccess = await updateAgentSettings({
        integrationId: integrationId,
        userId: user.id,
        apiUrl: data.apiUrl,
        apiToken: data.apiToken,
        timezone: data.timezone || 'UTC',
        approver: data.approver ? 1 : 0,
      });
      
      if (updateSuccess) {
        toast({
          title: 'Settings Updated',
          description: 'Integration settings have been updated successfully',
        });
        
        // Navigate back to central
        navigate(`/agents/${agentName}/central`);
      } else {
        throw new Error('Failed to update integration settings');
      }
    } catch (error: any) {
      console.error('Error updating integration:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update integration settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/agents/${agentName}/central`)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold flex items-center">
          <Settings className="mr-2 h-6 w-6" />
          Agent Settings
        </h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="apiUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://youraccount.api-us1.com" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Your ActiveCampaign API URL
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Token</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your API token" 
                      {...field} 
                      type="password"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Your ActiveCampaign API token
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select 
                    disabled={isLoading}
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezones.map((timezone) => (
                        <SelectItem key={timezone} value={timezone}>
                          {timezone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the timezone for this agent's operations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="approver"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-approve emails</FormLabel>
                    <FormDescription>
                      When enabled, emails will be sent without manual approval
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline" 
                onClick={() => navigate(`/agents/${agentName}/central`)}
                disabled={isLoading}
                className="mr-4"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AgentSettingsPage;
