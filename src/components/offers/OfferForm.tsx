
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_GOALS_TABLE_ID } from '@/lib/api/constants';
import { Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

// Define the form schema
const offerFormSchema = z.object({
  link: z.string().url('Must be a valid URL').or(z.string().length(0)),
  style: z.enum(['softsell', 'hardsell', 'nutring', 'event']),
  offer_name: z.string().min(1, 'Offer name is required'),
  goal: z.string().min(1, 'Goal is required'),
});

type OfferFormValues = z.infer<typeof offerFormSchema>;

interface OfferFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  initialData?: OfferFormValues;
  isEditing?: boolean;
  offerId?: string;
}

interface FirecrawlResponse {
  offer_name?: string;
  goal?: string;
}

const OfferForm = ({
  onSuccess,
  onError,
  initialData,
  isEditing = false,
  offerId,
}: OfferFormProps) => {
  const { agentName } = useParams<{ agentName: string }>();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urlTyping, setUrlTyping] = useState(false);

  // Configure the form
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: initialData || {
      link: '',
      style: 'nutring',
      offer_name: '',
      goal: '',
    },
  });

  // Get the current values from the form
  const link = form.watch('link');
  const style = form.watch('style');
  
  // Use debounce to wait for typing to finish
  const debouncedLink = useDebounce(link, 1500);

  // Function to fetch data from the Firecrawl webhook
  const fetchFirecrawlData = async (link: string, style: string) => {
    if (!link || !z.string().url().safeParse(link).success) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('https://primary-production-2e546.up.railway.app/webhook/firecrawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ link, style })
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      
      const data: FirecrawlResponse = await response.json();
      
      if (data.offer_name) {
        form.setValue('offer_name', data.offer_name);
      }
      
      if (data.goal) {
        form.setValue('goal', data.goal);
      }
      
    } catch (error) {
      console.error('Error fetching Firecrawl data:', error);
      onError(`Failed to fetch website data: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
      setUrlTyping(false);
    }
  };

  // Handle link input change and set the typing state
  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('link', e.target.value);
    setUrlTyping(true);
  };

  // Use the debounced link to fetch data
  useEffect(() => {
    if (debouncedLink && urlTyping) {
      fetchFirecrawlData(debouncedLink, style);
    }
  }, [debouncedLink]);

  const onSubmit = async (data: OfferFormValues) => {
    if (!user) {
      onError('You need to be logged in to perform this action');
      return;
    }

    if (!agentName) {
      onError('Agent name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for Airtable - remove empty fields to prevent validation errors
      const fields = { 
        ...data,
        activehosted: agentName,
        // Convert user.id to a number instead of a string
        id_user: Number(user.id),
      };
      
      // If link is empty, remove it
      if (!fields.link) {
        delete fields.link;
      }
      
      const airtableData = { fields };

      console.log('Submitting offer data:', airtableData);

      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_GOALS_TABLE_ID}`;
      
      // Determine if we're creating or updating
      let response;
      if (isEditing && offerId) {
        // Update existing record
        response = await fetch(`${url}/${offerId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(airtableData)
        });
      } else {
        // Create new record
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(airtableData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable API error:', errorData);
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} offer: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();
      console.log(`Offer ${isEditing ? 'updated' : 'created'} successfully:`, responseData);
      
      onSuccess(`Offer ${isEditing ? 'updated' : 'created'} successfully!`);
      
      if (!isEditing) {
        form.reset(); // Reset form after successful submission if creating new
      }
    } catch (error) {
      console.error('Error submitting offer:', error);
      onError(`Failed to ${isEditing ? 'update' : 'create'} offer: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com"
                  {...field}
                  onChange={handleLinkChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="style"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Style</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="softsell">Soft Sell</SelectItem>
                  <SelectItem value="hardsell">Hard Sell</SelectItem>
                  <SelectItem value="nutring">Nurturing</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading website data...</span>
          </div>
        )}

        <FormField
          control={form.control}
          name="offer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Offer Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter offer name"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter goal"
                  className="min-h-[100px]"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Offer' : 'Create Offer'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default OfferForm;
