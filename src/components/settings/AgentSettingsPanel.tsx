import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { fetchIntegrationByUserAndAgent, updateActiveCampaignIntegration, verifyActiveCampaignCredentials } from '@/lib/api-service';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Validation schema for integration settings
const integrationSchema = z.object({
  apiUrl: z.string().url('Must be a valid URL'),
  apiToken: z.string().min(1, 'API Token is required'),
  timezone: z.string().optional(),
  approver: z.boolean().default(false),
  remetente: z.string().optional(),
  email: z.string().email('Must be a valid email').optional().or(z.literal('')),
});

type IntegrationFormValues = z.infer<typeof integrationSchema>;

interface AgentSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  agentName: string;
}

const AgentSettingsPanel = ({ open, onClose, userId, agentName }: AgentSettingsPanelProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [integrationId, setIntegrationId] = useState<string | null>(null);

  // List of common timezones
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  // Initialize form with validation
  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      apiUrl: '',
      apiToken: '',
      timezone: 'America/New_York',
      approver: false,
      remetente: '',
      email: '',
    }
  });

  // Load integration data when dialog opens
  useEffect(() => {
    if (open && userId && agentName) {
      loadIntegrationData();
    }
  }, [open, userId, agentName]);

  // Fetch integration data from Airtable
  const loadIntegrationData = async () => {
    try {
      setIsLoading(true);
      const integration = await fetchIntegrationByUserAndAgent(userId, agentName);
      
      if (integration) {
        console.log('Loaded integration:', integration);
        // Store the integration ID to use for updates
        setIntegrationId(integration.id);
        
        // Format the API URL for display
        let formattedApiUrl = integration.api;
        if (!formattedApiUrl.startsWith('http')) {
          formattedApiUrl = `https://${formattedApiUrl}.api-us1.com`;
        }
        
        // Set form values - convert approver from number to boolean
        form.reset({
          apiUrl: formattedApiUrl,
          apiToken: integration.token || '',
          timezone: integration.timezone || 'America/New_York',
          // Convert approver from number (0/1) to boolean
          approver: integration.approver === 1,
          remetente: integration.remetente || '',
          email: integration.email || '',
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
      // Pass the integrationId to ensure we update the existing record
      const success = await updateActiveCampaignIntegration({
        userId: String(userId),
        apiUrl: data.apiUrl,
        apiToken: data.apiToken,
        integrationId: integrationId || undefined, // Pass the integration ID for update
        timezone: data.timezone,
        // Convert boolean to number (0/1)
        approver: data.approver ? 1 : 0,
        remetente: data.remetente,
        email: data.email,
      });
      
      if (success) {
        toast({
          title: 'Settings Updated',
          description: 'Integration settings have been updated successfully',
        });
        onClose();
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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agent Settings</DialogTitle>
          <DialogDescription>
            Update your ActiveCampaign integration settings for this agent.
          </DialogDescription>
        </DialogHeader>
        
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
              name="remetente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Company or Personal Name" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Name that will appear as the sender in emails
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="sender@example.com" 
                      {...field} 
                      type="email"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Email address that will be used to send emails
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
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
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
                    Select your local timezone for accurate scheduling
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
                      When enabled, emails will be sent without requiring manual approval
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
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AgentSettingsPanel;
