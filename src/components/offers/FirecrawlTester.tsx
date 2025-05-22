
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { fetchWebsiteData, testFirecrawlWithRealAPI, testFirecrawlWithSampleData } from '@/lib/api-service';

// Define the form schema
const testerFormSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  style: z.enum(['softsell', 'hardsell', 'nutring', 'event']),
});

type TesterFormValues = z.infer<typeof testerFormSchema>;

interface FirecrawlTesterProps {
  onClose?: () => void;
}

const FirecrawlTester = ({ onClose }: FirecrawlTesterProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Configure the form
  const form = useForm<TesterFormValues>({
    resolver: zodResolver(testerFormSchema),
    defaultValues: {
      url: 'https://example.com',
      style: 'softsell',
    },
  });

  const onSubmit = async (data: TesterFormValues) => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      // Test with real API
      const result = await testFirecrawlWithRealAPI(data.url, data.style);
      setApiResponse(result);
      
      if (!result.success) {
        setError(result.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error testing API:', err);
      setError(err instanceof Error ? err.message : 'Failed to test API');
    } finally {
      setIsLoading(false);
    }
  };
  
  const testSampleData = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      const result = await testFirecrawlWithSampleData();
      setApiResponse(result);
    } catch (err) {
      console.error('Error loading sample data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Firecrawl API Tester</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
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
                        <SelectValue placeholder="Select style" />
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
            
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Testing...' : 'Test Real API'}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={testSampleData}
                disabled={isLoading}
                className="flex-1"
              >
                Test Sample Data
              </Button>
            </div>
          </form>
        </Form>
        
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading...</span>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
            <h3 className="font-semibold mb-2">Error:</h3>
            <p>{error}</p>
          </div>
        )}
        
        {apiResponse && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">API Response:</h3>
            <pre className="bg-gray-50 p-4 rounded border overflow-auto max-h-80 text-sm">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FirecrawlTester;
