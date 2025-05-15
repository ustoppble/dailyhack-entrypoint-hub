
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { validateActiveCampaignUrl } from '@/lib/validation';

// Schema definition moved to a shared location
export const integrationFormSchema = z.object({
  apiUrl: z.string()
    .min(1, { message: "API URL is required" })
    .refine(url => validateActiveCampaignUrl(url), {
      message: "API URL must be a valid ActiveCampaign URL (e.g., youraccount.api-us1.com or youraccount.activehosted.com)"
    }),
  apiToken: z.string().min(5, { message: "API token is required" }),
});

export type IntegrationFormValues = z.infer<typeof integrationFormSchema>;

interface FormFieldsProps {
  form: UseFormReturn<IntegrationFormValues>;
}

const FormFields = ({ form }: FormFieldsProps) => {
  return (
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
  );
};

export default FormFields;
