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
import { Loader2, AlertTriangle } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchWebsiteData } from '@/lib/api/firecrawl';

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
  const [firecrawlError, setFirecrawlError] = useState<string | null>(null);

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
    setFirecrawlError(null); // Clear previous errors
    
    try {
      const response = await fetchWebsiteData(link, style);
      console.log('Firecrawl response in form:', response);
      
      // Check if there was an error in the response
      if (response.error || response.success === false) {
        throw new Error(response.error || 'Failed to fetch website data');
      }
      
      // Handle the array response format we're getting from the webhook
      if (Array.isArray(response)) {
        console.log('Processing array response:', response);
        
        // Get the first item in the array
        if (response.length > 0) {
          const firstItem = response[0];
          console.log('Examining first item in array:', firstItem);
          
          // Check if it has an output object
          if (firstItem.output) {
            console.log('Found output object:', firstItem.output);
            
            // Extract title and goal from the output object
            if (firstItem.output.title) {
              console.log('Setting offer_name from title:', firstItem.output.title);
              form.setValue('offer_name', firstItem.output.title);
            }
            
            if (firstItem.output.goal) {
              console.log('Setting goal:', firstItem.output.goal);
              form.setValue('goal', firstItem.output.goal);
            }
          }
        }
      } 
      // Handle single object response with output property
      else if (response && typeof response === 'object' && response.output) {
        console.log('Processing object response with output property:', response);
        
        if (response.output.title) {
          console.log('Setting offer_name from title:', response.output.title);
          form.setValue('offer_name', response.output.title);
        }
        
        if (response.output.goal) {
          console.log('Setting goal:', response.output.goal);
          form.setValue('goal', response.output.goal);
        }
      }
      // Handle direct properties on the response object
      else if (response && typeof response === 'object') {
        console.log('Checking direct properties on response object');
        
        if (response.title) {
          console.log('Setting offer_name from direct title:', response.title);
          form.setValue('offer_name', response.title);
        }
        
        if (response.goal) {
          console.log('Setting goal from direct goal:', response.goal);
          form.setValue('goal', response.goal);
        }
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Invalid response format from Firecrawl API');
      }
      
    } catch (error) {
      console.error('Error fetching Firecrawl data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch website data';
      setFirecrawlError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
      setUrlTyping(false);
    }
  };

  // Handle link input change and set the typing state
  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('link', e.target.value);
    setUrlTyping(true);
    // Clear the error when the user starts typing again
    if (firecrawlError) setFirecrawlError(null);
  };

  // Use the debounced link to fetch data
  useEffect(() => {
    if (debouncedLink && urlTyping) {
      fetchFirecrawlData(debouncedLink, style);
    }
  }, [debouncedLink]);

  // Reset Firecrawl error when style changes
  useEffect(() => {
    if (firecrawlError && debouncedLink) {
      setFirecrawlError(null);
    }
  }, [style]);

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
        // Always include user ID when creating/updating offers
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
          name="style"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Style</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // If we have a valid link, try fetching with the new style
                  if (debouncedLink && z.string().url().safeParse(debouncedLink).success) {
                    setUrlTyping(true);
                    fetchFirecrawlData(debouncedLink, value);
                  }
                }}
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

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading website data...</span>
          </div>
        )}
        
        {firecrawlError && (
          <div className="flex items-center justify-start py-2 px-3 bg-red-50 rounded-md border border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-red-600">
              {firecrawlError}. Please try again or fill in manually.
            </span>
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
