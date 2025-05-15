
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { Send, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StatusMessage from '@/components/integration/StatusMessage';

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters",
  }),
});

type KnowledgeResponse = Array<{
  metadata: {
    source: string;
    blobType: string;
    loc: {
      lines: {
        from: number;
        to: number;
      };
    };
    resumo: string;
    insight: string;
    categorias: string;
    título_live: string;
  };
  pageContent: string;
}>;

const KnowledgeBasePage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<KnowledgeResponse | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You need to be logged in to submit knowledge",
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
    setResponseData(null);
    
    try {
      const payload = {
        texto: values.content,
        título: values.title,
        activehosted: agentName,
        id_users: user.id
      };
      
      console.log('Sending data to API:', payload);
      
      const response = await axios.post(
        'https://primary-production-2e546.up.railway.app/webhook/nutrir-conhecimento',
        payload
      );
      
      console.log('API response:', response.data);
      
      setSuccess("Knowledge successfully added to the base.");
      setResponseData(response.data);
      
      toast({
        title: "Success!",
        description: "Knowledge successfully added to the base.",
      });
      
      // Reset form after successful submission
      form.reset();
      
    } catch (error: any) {
      console.error('Error sending knowledge:', error);
      setError(error.message || "An error occurred while processing your request");
      toast({
        title: "Error sending knowledge",
        description: error.message || "An error occurred while processing your request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-md mb-6">
          <CardHeader className="border-b">
            <CardTitle className="text-3xl font-bold">Knowledge Base</CardTitle>
            <CardDescription>
              Add information to nurture the knowledge base of {agentName}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert className="mb-6">
              <AlertDescription>
                This text will be processed and added to your agent's knowledge base. The more detailed and relevant the content, the better your agent will perform.
              </AlertDescription>
            </Alert>
            
            <StatusMessage error={error} success={success} />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Knowledge Base Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter a title for this knowledge base..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Knowledge Base Text</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the text you want to add to the knowledge base..."
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
                      'Submitting...'
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Submit Knowledge
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {responseData && responseData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="border-b bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-xl font-bold">Knowledge successfully added!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Title</h3>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {responseData[0].metadata.título_live}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Content</h3>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {responseData[0].pageContent}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {responseData[0].metadata.resumo}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Insight</h3>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {responseData[0].metadata.insight}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Categories</h3>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {responseData[0].metadata.categorias}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
