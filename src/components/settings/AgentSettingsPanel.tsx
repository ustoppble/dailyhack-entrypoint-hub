
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { fetchIntegrationByUserAndAgent, updateActiveCampaignIntegration, verifyActiveCampaignCredentials } from '@/lib/api-service';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Validation schema for integration settings
const integrationSchema = z.object({
  apiUrl: z.string().url('Must be a valid URL'),
  apiToken: z.string().min(1, 'API Token is required'),
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

  // Initialize form with validation
  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      apiUrl: '',
      apiToken: '',
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
      const updateSuccess = await updateActiveCampaignIntegration({
        userId: userId,
        apiUrl: data.apiUrl,
        apiToken: data.apiToken,
      });
      
      if (updateSuccess) {
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
