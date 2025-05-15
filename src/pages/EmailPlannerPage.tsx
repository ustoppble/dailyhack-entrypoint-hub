
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { ArrowLeft, Mail, Send, List, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StatusMessage from '@/components/integration/StatusMessage';

const emailFormSchema = z.object({
  subject: z.string().min(3, {
    message: "Subject must be at least 3 characters",
  }),
  emailType: z.string({
    required_error: "Please select an email type",
  }),
  targetAudience: z.string().min(3, {
    message: "Target audience description must be at least 3 characters",
  }),
  mainGoal: z.string().min(3, {
    message: "Main goal must be at least 3 characters",
  }),
  additionalNotes: z.string().optional(),
});

type EmailPlannerFormValues = z.infer<typeof emailFormSchema>;

const EmailPlannerPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState<string | null>(null);
  
  const form = useForm<EmailPlannerFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      subject: "",
      emailType: "",
      targetAudience: "",
      mainGoal: "",
      additionalNotes: "",
    },
  });
  
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
    
    // For demonstration purposes, instead of making an actual API call,
    // we'll simulate a response based on the form values
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate demo email content based on form inputs
      const generatedEmail = generateEmailContent(values);
      setEmailContent(generatedEmail);
      setSuccess("Email draft successfully created!");
      
      toast({
        title: "Success!",
        description: "Email draft successfully created!",
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
    const { subject, emailType, targetAudience, mainGoal, additionalNotes } = values;
    
    let content = '';
    
    switch (emailType) {
      case 'newsletter':
        content = `
Subject: ${subject}

Hi there!

Welcome to our latest newsletter. We've put together some valuable content specifically designed for ${targetAudience}.

Our main focus this week is to ${mainGoal}. We believe this information will be extremely valuable for you.

${additionalNotes ? `Additional note: ${additionalNotes}` : ''}

Stay tuned for more updates!

Best regards,
The ${agentName} Team
        `;
        break;
        
      case 'promotional':
        content = `
Subject: ${subject}

Hello!

We're excited to share this special offer with you! As someone who ${targetAudience}, we think you'll be interested.

We've designed this promotion to help you ${mainGoal}.

${additionalNotes ? `Special note: ${additionalNotes}` : ''}

Don't miss out on this opportunity!

Best regards,
The ${agentName} Team
        `;
        break;
        
      case 'welcome':
        content = `
Subject: ${subject}

Welcome!

Thank you for joining our community of ${targetAudience}!

We're here to help you ${mainGoal}, and we're excited to have you on board.

${additionalNotes ? `Just wanted to add: ${additionalNotes}` : ''}

Feel free to reply if you have any questions.

Warmly,
The ${agentName} Team
        `;
        break;
        
      default:
        content = `
Subject: ${subject}

Hello!

We're reaching out to our valued ${targetAudience}.

We wanted to connect regarding ${mainGoal}.

${additionalNotes ? `Note: ${additionalNotes}` : ''}

Looking forward to connecting with you soon!

Best,
The ${agentName} Team
        `;
    }
    
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
                Provide information about your email campaign to generate a draft. The more details you provide, the better tailored your email will be.
              </AlertDescription>
            </Alert>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter a subject for your email..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emailType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the type of email" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                          <SelectItem value="promotional">Promotional</SelectItem>
                          <SelectItem value="welcome">Welcome Email</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Describe who this email is for..."
                          {...field}
                        />
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
                      <FormLabel>Main Goal</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="What is the main goal of this email?"
                          {...field}
                        />
                      </FormControl>
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
