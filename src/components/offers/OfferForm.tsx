
import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_GOALS_TABLE_ID } from '@/lib/api/constants';

// Define the form schema
const offerFormSchema = z.object({
  offer_name: z.string().min(1, 'Offer name is required'),
  goal: z.string().min(1, 'Goal is required'),
  link: z.string().url('Must be a valid URL').or(z.string().length(0)),
  style: z.enum(['softsell', 'hardsell', 'nutring', 'event']),
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  
  // Configure the form
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: initialData || {
      offer_name: '',
      goal: '',
      link: '',
      style: 'nutring',
    },
  });
  
  // Get the current style value to conditionally show link input
  const styleValue = form.watch('style');
  const linkValue = form.watch('link');
  
  // Function to fetch content from Firecrawl
  const fetchContentFromUrl = async (url: string) => {
    if (!url) return;
    
    setIsFetchingContent(true);
    
    try {
      const apiKey = 'fc-c33c37abfbec499b99465690d943719c';
      
      // Make a request to the Firecrawl API
      const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          url: url,
          limit: 1, // Just crawl the main page
          scrapeOptions: {
            formats: ['markdown']
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Firecrawl API error:', errorData);
        throw new Error(`Failed to fetch content: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Firecrawl crawl initiated:', data);
      
      // Now check the status of the crawl
      if (data.success && data.id) {
        // Poll for results
        let crawlComplete = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!crawlComplete && attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          
          const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${data.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          });
          
          if (!statusResponse.ok) {
            continue; // Try again
          }
          
          const statusData = await statusResponse.json();
          console.log('Crawl status:', statusData);
          
          if (statusData.status === 'completed' || statusData.data?.length > 0) {
            crawlComplete = true;
            
            // Extract content from the first page
            if (statusData.data && statusData.data.length > 0) {
              const pageData = statusData.data[0];
              const extractedContent = pageData.markdown || 
                pageData.html || 
                `Content extracted from ${url}`;
              
              // Format the content to be shorter and more suitable for a goal
              const formattedContent = formatExtractedContent(extractedContent, url);
              
              // Update the goal field
              form.setValue('goal', formattedContent);
            }
          }
        }
        
        if (!crawlComplete) {
          throw new Error('Could not complete content extraction in time');
        }
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      onError(`Failed to fetch content: ${(error as Error).message}`);
    } finally {
      setIsFetchingContent(false);
    }
  };
  
  // Helper function to format extracted content
  const formatExtractedContent = (content: string, url: string) => {
    // Extract the first 300 characters for the goal
    let formattedContent = content.substring(0, 300).trim();
    
    // Add ellipsis if content was truncated
    if (content.length > 300) {
      formattedContent += '...';
    }
    
    return `Content from ${url}: ${formattedContent}`;
  };
  
  // Effect to fetch content when link changes and style is not nurturing
  React.useEffect(() => {
    if (styleValue !== 'nutring' && linkValue && !isEditing) {
      fetchContentFromUrl(linkValue);
    }
  }, [linkValue, styleValue]);

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
        {/* Style selection now first */}
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditionally show link field if style is not nurturing */}
        {styleValue !== 'nutring' && (
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Enter goal"
                    className={isFetchingContent ? "min-h-[120px]" : ""}
                    {...field}
                  />
                  {isFetchingContent && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm">Fetching content...</span>
                      </div>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || isFetchingContent}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Campaign Goal' : 'Create Campaign Goal'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default OfferForm;
