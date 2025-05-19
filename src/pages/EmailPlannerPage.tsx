
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { ArrowLeft, Mail, Send, List, BookOpen, CheckCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StatusMessage from '@/components/integration/StatusMessage';
import { fetchConnectedLists, createAutopilotRecord } from '@/lib/api-service';
import { Checkbox } from '@/components/ui/checkbox';

// Updated schema with emailFrequency instead of emailCount
const emailFormSchema = z.object({
  mainGoal: z.string().min(3, {
    message: "Main goal must be at least 3 characters",
  }),
  emailFrequency: z.enum(['once', 'twice'], {
    required_error: "Please select how many emails to produce per day",
  }),
  selectedLists: z.array(z.string()).min(1, {
    message: "Please select at least one list",
  }),
});

type EmailPlannerFormValues = z.infer<typeof emailFormSchema>;

// List item interface with id and name
interface ListItem {
  id: string;
  name: string;
}

const EmailPlannerPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [lists, setLists] = useState<ListItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<EmailPlannerFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      mainGoal: "",
      emailFrequency: "once",
      selectedLists: [],
    },
  });
  
  useEffect(() => {
    const loadConnectedLists = async () => {
      if (!agentName) return;
      
      try {
        setIsLoading(true);
        // Fetch the lists that are already connected to this agent
        const connectedLists = await fetchConnectedLists(agentName);
        setLists(connectedLists);
      } catch (error) {
        console.error("Error loading connected lists:", error);
        setError("Failed to load connected lists");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConnectedLists();
  }, [agentName]);
  
  const onSubmit = async (values: EmailPlannerFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You need to be logged in to use this feature",
        variant: "destructive",
      });
      return;
    }
    
    if (!agentName) {
      toast({
        title: "Error",
        description: "Agent name not found",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Updated webhook URL as specified by the user
      const webhookUrl = 'https://primary-production-2e546.up.railway.app/webhook/62eb5369-3119-41d2-a923-eb2aea9bd0df';
      
      // Get list names for the success message
      const selectedListNames = values.selectedLists.map(listId => {
        const list = lists.find(list => list.id === listId);
        return list ? list.name : listId;
      });
      
      // Process each list individually
      for (const listId of values.selectedLists) {
        // Prepare data to send to webhook - one list per request
        const requestData = {
          agentName,
          lists: [listId], // Only send one list ID per request
          mainGoal: values.mainGoal,
          emailFrequency: values.emailFrequency, // New field instead of emailCount
        };
        
        // Send the form data to the specified webhook for this list
        const response = await axios.post(webhookUrl, requestData);
        console.log(`Webhook response for list ${listId}:`, response.data);
        
        // Create record in Airtable autopilot table
        const cronId = values.emailFrequency === "once" ? 1 : 2;
        await createAutopilotRecord(
          listId,
          agentName, // Using agentName as the url parameter
          cronId
        );
      }
      
      const emailFrequencyText = values.emailFrequency === "once" ? "1 email per day (08h)" : "2 emails per day (08h and 20h)";
      const successMessage = `Your email campaign is now in production! ${emailFrequencyText} will be sent to ${selectedListNames.join(", ")}.`;
      
      setSuccess(successMessage);
    } catch (err: any) {
      console.error('Error activating email autopilot:', err);
      setError(err.message || "An error occurred while activating your email autopilot");
      toast({
        title: "Error activating email autopilot",
        description: err.message || "An error occurred while activating your email autopilot",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/agents/${agentName}/central`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Central
            </Button>
            <h1 className="text-3xl font-bold">{agentName}</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate(`/agents/${agentName}/lists`)}
            >
              <List className="h-4 w-4" /> Lists
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate(`/agents/${agentName}/knowledge`)}
            >
              <BookOpen className="h-4 w-4" /> Knowledge
            </Button>
          </div>
        </div>
        
        <StatusMessage error={error} success={success} />
        
        {success ? (
          <Card className="shadow-md mb-6">
            <CardHeader className="border-b bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-xl font-bold">Email Autopilot Activated</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
                <AlertDescription className="text-center py-4">
                  {success}
                </AlertDescription>
              </Alert>
              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={() => navigate(`/agents/${agentName}/central`)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Central
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-md mb-6">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-3xl font-bold">Email Autopilot</CardTitle>
              </div>
              <CardDescription>
                Activate automatic email production for {agentName}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert className="mb-6">
                <AlertDescription>
                  Activate the autopilot by providing a goal and selecting how many emails to automatically produce and send. Your agent will handle the content creation.
                </AlertDescription>
              </Alert>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* List selection with multiple checkbox selection */}
                  <FormField
                    control={form.control}
                    name="selectedLists"
                    render={() => (
                      <FormItem>
                        <FormLabel>Select Lists to Send To</FormLabel>
                        <div className="border rounded-md p-4 space-y-3">
                          {isLoading ? (
                            <p className="text-center py-2">Loading lists...</p>
                          ) : lists.length > 0 ? (
                            lists.map((list) => (
                              <FormField
                                key={list.id}
                                control={form.control}
                                name="selectedLists"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={list.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(list.id)}
                                          onCheckedChange={(checked) => {
                                            const updatedLists = checked
                                              ? [...field.value, list.id]
                                              : field.value?.filter(
                                                  (value) => value !== list.id
                                                );
                                            field.onChange(updatedLists);
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        {list.name}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))
                          ) : (
                            <div className="text-center py-2">
                              <p className="text-gray-500">No lists connected to this agent</p>
                              <Button 
                                variant="link" 
                                className="mt-1" 
                                onClick={() => navigate(`/agents/${agentName}/lists`)}
                              >
                                Go to Lists
                              </Button>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Radio button email frequency selection */}
                  <FormField
                    control={form.control}
                    name="emailFrequency"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Number of Emails per Day</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="once" id="once" />
                              </FormControl>
                              <FormLabel className="font-normal" htmlFor="once">
                                1 email per day (08h)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="twice" id="twice" />
                              </FormControl>
                              <FormLabel className="font-normal" htmlFor="twice">
                                2 emails per day (08h and 20h)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="mainGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Goal</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What is the goal of this email campaign? What should it achieve? Include all necessary information here..."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-8"
                    >
                      {isSubmitting ? (
                        'Processing...'
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" /> Activate Email Autopilot
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmailPlannerPage;
