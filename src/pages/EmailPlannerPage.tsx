
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { ArrowLeft, Mail, Send, List, BookOpen, Link, Pencil } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StatusMessage from '@/components/integration/StatusMessage';
import { fetchConnectedLists } from '@/lib/api/lists';
import { EmailList } from '@/lib/api/types';

// Updated schema with only mainGoal and emailCount
const emailFormSchema = z.object({
  mainGoal: z.string().min(3, {
    message: "Main goal must be at least 3 characters",
  }),
  emailCount: z.string({
    required_error: "Please select how many emails to plan",
  }),
  selectedList: z.string({
    required_error: "Please select a list",
  }),
  additionalNotes: z.string().optional(),
});

type EmailPlannerFormValues = z.infer<typeof emailFormSchema>;

const EmailPlannerPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [lists, setLists] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState<string | null>(null);
  
  const form = useForm<EmailPlannerFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      mainGoal: "",
      emailCount: "1",
      selectedList: "",
      additionalNotes: "",
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
    setEmailContent(null);
    
    try {
      // Updated webhook URL
      const webhookUrl = 'https://primary-production-2e546.up.railway.app/webhook/62eb5369-3119-41d2-a923-eb2aea9bd0df';
      
      // Prepare data to send to webhook
      const requestData = {
        agentName,
        list: values.selectedList,
        mainGoal: values.mainGoal,
        emailCount: values.emailCount,
        additionalNotes: values.additionalNotes || '',
      };
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate demo email content based on form inputs
      const generatedEmail = generateEmailContent(values);
      setEmailContent(generatedEmail);
      setSuccess(`Email draft successfully created for ${values.emailCount} email(s)!`);
      
      toast({
        title: "Success!",
        description: `Email draft successfully created for ${values.emailCount} email(s)!`,
      });
      
    } catch (err: any) {
      console.error('Error generating email:', err);
      setError(err.message || "An error occurred while processing your request");
      toast({
        title: "Error generating email",
        description: err.message || "An error occurred while processing your request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to generate sample email content
  const generateEmailContent = (values: EmailPlannerFormValues): string => {
    const { mainGoal, additionalNotes, emailCount, selectedList } = values;
    
    const content = `
To: ${selectedList}

${mainGoal}

${additionalNotes ? `Additional note: ${additionalNotes}` : ''}

This is email 1 of ${emailCount}.

Best regards,
The ${agentName} Team
    `;
        
    return content.trim();
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
        
        {/* Connected Lists Card */}
        <Card className="shadow-md mb-6">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center">
              <List className="mr-2 h-5 w-5" /> Connected Lists
            </CardTitle>
            <CardDescription>
              These are the lists associated with {agentName}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <p className="text-center py-4">Loading lists...</p>
            ) : lists.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>List Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.map((listName) => (
                    <TableRow key={listName}>
                      <TableCell>{listName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-md">
                <p className="text-gray-500">No lists connected to this agent yet</p>
                <Button 
                  variant="link" 
                  className="mt-2" 
                  onClick={() => navigate(`/agents/${agentName}/lists`)}
                >
                  Go to Lists
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-md mb-6">
          <CardHeader className="border-b">
            <CardTitle className="text-3xl font-bold">Email Planner</CardTitle>
            <CardDescription>
              Plan and draft email campaigns for {agentName}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert className="mb-6">
              <AlertDescription>
                Provide information about your email campaign to generate a draft. You can include links and offers in the main goal field.
              </AlertDescription>
            </Alert>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="selectedList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select List</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a list to send to" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lists.map((listName) => (
                            <SelectItem key={listName} value={listName}>{listName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mainGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Main Goal <Pencil className="h-4 w-4 text-gray-500" />
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What is the main goal of this email? You can include links, offers, or other content here..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <div className="flex gap-2 mt-2 text-sm text-gray-500">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="text-xs gap-1"
                          onClick={() => {
                            const currentValue = form.getValues("mainGoal");
                            form.setValue("mainGoal", currentValue + " [Link]");
                          }}
                        >
                          <Link className="h-3 w-3" /> Add Link
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="text-xs gap-1"
                          onClick={() => {
                            const currentValue = form.getValues("mainGoal");
                            form.setValue("mainGoal", currentValue + " [Special Offer]");
                          }}
                        >
                          <Mail className="h-3 w-3" /> Add Offer
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emailCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Emails to Plan</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="How many emails do you want to plan?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 Email</SelectItem>
                          <SelectItem value="3">3 Emails</SelectItem>
                          <SelectItem value="5">5 Emails</SelectItem>
                          <SelectItem value="7">7 Emails</SelectItem>
                          <SelectItem value="10">10 Emails</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional details, context, or specific points to include..."
                          className="min-h-[100px]"
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
                      'Generating...'
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Generate Email Draft
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {emailContent && (
          <Card className="shadow-md">
            <CardHeader className="border-b bg-green-50">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                <CardTitle className="text-xl font-bold">Generated Email Draft</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-white border rounded-md p-6 whitespace-pre-wrap font-mono text-sm">
                {emailContent}
              </div>
              <div className="mt-6 flex justify-end">
                <Button variant="outline" className="mr-2">
                  Edit Draft
                </Button>
                <Button>
                  <Send className="mr-2 h-4 w-4" /> Save Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmailPlannerPage;
