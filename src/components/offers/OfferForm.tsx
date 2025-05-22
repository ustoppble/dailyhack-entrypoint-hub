
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
import { Switch } from '@/components/ui/switch';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_GOALS_TABLE_ID } from '@/lib/api/constants';
import { Loader2, AlertTriangle, InfoIcon } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchWebsiteData, testFirecrawlWithSampleData } from '@/lib/api-service';

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
  const [useTestData, setUseTestData] = useState(true); // Default to test data for now

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

  // Toggle between test data and live API
  const toggleTestMode = () => {
    setUseTestData(prev => !prev);
    setFirecrawlError(null); // Clear previous errors when switching modes
    
    // If switching to test mode and we have a link, try to fetch with test data
    if (!useTestData && debouncedLink && z.string().url().safeParse(debouncedLink).success) {
      fetchFirecrawlData(debouncedLink, style);
    }
  };

  // Function to load test data directly
  const loadTestData = async () => {
    setIsLoading(true);
    setFirecrawlError(null);
    
    try {
      // Use the test utility directly
      const testResult = await testFirecrawlWithSampleData();
      console.log('Test data result:', testResult);
      
      if (testResult && testResult[0]?.output) {
        const output = testResult[0].output;
        form.setValue('offer_name', output.title || '');
        form.setValue('goal', output.goal || '');
        return;
      }
      
      throw new Error('Test data has unexpected format');
    } catch (error) {
      console.error('Error loading test data:', error);
      setFirecrawlError('Failed to load test data');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch data from the Firecrawl webhook
  const fetchFirecrawlData = async (link: string, style: string) => {
    if (!link || !z.string().url().safeParse(link).success) return;
    
    setIsLoading(true);
    setFirecrawlError(null); // Clear previous errors

    try {
      // If in test mode, use the test data
      if (useTestData) {
        await loadTestData();
        return;
      }
      
      // Normal API call with useTestData flag
      const response = await fetchWebsiteData(link, style, null, false);
      console.log('Firecrawl response in form:', response);
      
      // Check if there was an error in the response
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch website data');
      }
      
      // Extract data from the response
      if (response.output) {
        console.log('Setting form values from API response:', response.output);
        
        if (response.output.title) {
          console.log('Setting offer_name from title:', response.output.title);
          form.setValue('offer_name', response.output.title);
        }
        
        if (response.output.goal) {
          console.log('Setting goal:', response.output.goal);
          form.setValue('goal', response.output.goal);
        }
      } else {
        console.error('No output data found in response:', response);
        throw new Error('No output data found in API response');
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

  // Load test data on initial load
  useEffect(() => {
    if (useTestData && !initialData && !form.formState.isDirty) {
      loadTestData();
    }
  }, []);

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
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <div className="flex items-center space-x-2">
            <Switch 
              id="test-mode"
              checked={useTestData}
              onCheckedChange={toggleTestMode}
            />
            <label 
              htmlFor="test-mode" 
              className="text-sm font-medium cursor-pointer">
              Use Test Data
            </label>
          </div>
          
          {useTestData && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadTestData}
              disabled={isLoading}
            >
              Reload Test Data
            </Button>
          )}
        </div>

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
                  disabled={useTestData} // Disable when using test data
                />
              </FormControl>
              {useTestData && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <InfoIcon className="h-3 w-3 mr-1" />
                  URL input is disabled in test mode
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading {useTestData ? "test" : "website"} data...</span>
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
