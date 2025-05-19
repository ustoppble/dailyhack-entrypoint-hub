import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { ArrowLeft, Mail, Send, List, BookOpen, CheckCircle, Zap, AlertCircle, Loader2, Link, Eye, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StatusMessage from '@/components/integration/StatusMessage';
import { Badge } from '@/components/ui/badge';
import { 
  fetchConnectedLists, 
  createAutopilotRecord, 
  fetchAutopilotRecords,
  AutopilotRecord,
  fetchCampaignGoals,
  CampaignGoal,
  deleteAutopilotRecord
} from '@/lib/api-service';
import { Checkbox } from '@/components/ui/checkbox';
import LoadingState from '@/components/lists/LoadingState';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ManageAutopilotForm from '@/components/autopilot/ManageAutopilotForm';
import EmailsList from '@/components/autopilot/EmailsList';

// Updated schema with goal selection instead of text input
const emailFormSchema = z.object({
  campaignGoalId: z.string({
    required_error: "Please select a campaign goal",
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
  hasAutopilot?: boolean;
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
  const [autopilotData, setAutopilotData] = useState<AutopilotRecord[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [campaignGoals, setCampaignGoals] = useState<CampaignGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | null>(null);
  
  // Dialog state for manage and view emails
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [viewEmailsDialogOpen, setViewEmailsDialogOpen] = useState(false);
  const [selectedAutopilot, setSelectedAutopilot] = useState<AutopilotRecord | null>(null);
  
  const form = useForm<EmailPlannerFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      campaignGoalId: "",
      emailFrequency: "once",
      selectedLists: [],
    },
  });
  
  // Handle goal selection and update selected goal state
  const handleGoalSelection = (goalId: string) => {
    const goal = campaignGoals.find(g => g.id === goalId);
    setSelectedGoal(goal || null);
  };

  // Function to get list name by ID
  const getListNameById = (listId: number): string => {
    const list = lists.find(l => Number(l.id) === listId);
    return list ? list.name : `List #${listId}`;
  };
  
  // Function to get email frequency text
  const getFrequencyText = (cronId: number): string => {
    return cronId === 1 ? "1 email per day (08h)" : "2 emails per day (08h and 20h)";
  };
  
  // Handle clicking manage button for an autopilot
  const handleManageAutopilot = (autopilot: AutopilotRecord) => {
    setSelectedAutopilot(autopilot);
    setManageDialogOpen(true);
  };
  
  // Update this function to navigate instead of opening a dialog
  const handleViewEmails = (autopilot: AutopilotRecord) => {
    navigate(`/agents/${agentName}/list-emails/${autopilot.listId}`);
  };
  
  // Refresh data after changes
  const refreshData = async () => {
    if (!agentName) return;
    
    try {
      setIsLoading(true);
      setDataReady(false);
      
      // Fetch all data before displaying anything
      const [autopilotRecords, connectedLists, goals] = await Promise.all([
        fetchAutopilotRecords(agentName),
        fetchConnectedLists(agentName),
        fetchCampaignGoals(agentName)
      ]);
      
      // Enhance autopilot records with list names
      const enhancedAutopilotRecords = autopilotRecords.map(record => ({
        ...record,
        listName: connectedLists.find(l => Number(l.id) === record.listId)?.name
      }));
      
      setAutopilotData(enhancedAutopilotRecords);
      console.log('Autopilot records:', enhancedAutopilotRecords);
      
      // Mark lists that already have autopilot
      const listsWithAutopilotStatus = connectedLists.map(list => ({
        ...list,
        hasAutopilot: autopilotRecords.some(record => record.listId === Number(list.id))
      }));
      
      setLists(listsWithAutopilotStatus);
      setCampaignGoals(goals);
      
      // Only now we mark data as ready
      setDataReady(true);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load lists or campaign goals data");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshData();
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
    
    // Make sure we have a valid goal
    const selectedGoalData = campaignGoals.find(g => g.id === values.campaignGoalId);
    if (!selectedGoalData) {
      toast({
        title: "Error",
        description: "Please select a valid campaign goal",
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
        // Skip lists that already have autopilot
        const hasExistingAutopilot = autopilotData.some(record => record.listId === Number(listId));
        if (hasExistingAutopilot) {
          console.log(`Skipping list ${listId} as it already has an autopilot`);
          continue;
        }
        
        // Prepare data to send to webhook - one list per request
        const requestData = {
          agentName,
          lists: [listId], // Only send one list ID per request
          mainGoal: selectedGoalData.objetivo, // Use the selected goal's objective
          emailFrequency: values.emailFrequency,
          goalLink: selectedGoalData.link, // Include the goal link
          goalStyle: selectedGoalData.style, // Include the goal style
        };
        
        // Send the form data to the specified webhook for this list
        const response = await axios.post(webhookUrl, requestData);
        console.log(`Webhook response for list ${listId}:`, response.data);
        
        // Create record in Airtable autopilot table
        const cronId = values.emailFrequency === "once" ? 1 : 2;
        await createAutopilotRecord(
          listId,
          agentName, // Using agentName as the url parameter
          cronId,
          values.campaignGoalId // Pass the selected goal ID
        );
      }
      
      const emailFrequencyText = values.emailFrequency === "once" ? "1 email per day (08h)" : "2 emails per day (08h and 20h)";
      const successMessage = `Your email campaign "${selectedGoalData.offer_name || selectedGoalData.objetivo}" is now in production! ${emailFrequencyText} will be sent to ${selectedListNames.join(", ")}.`;
      
      setSuccess(successMessage);
      
      // Refresh data to show new autopilots
      await refreshData();
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
        ) : isLoading || !dataReady ? (
          <LoadingState text="Loading and validating lists..." />
        ) : (
          <>
            {/* Active Autopilots Section */}
            {autopilotData.length > 0 && (
              <Card className="shadow-md mb-6">
                <CardHeader className="border-b bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-xl font-bold">Active Email Autopilots</CardTitle>
                  </div>
                  <CardDescription>
                    Currently active autopilot campaigns for {agentName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {autopilotData.map((autopilot) => (
                      <div key={autopilot.id} className="border rounded-md p-4 bg-white shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">
                              {autopilot.listName || `List #${autopilot.listId}`}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {getFrequencyText(autopilot.cronId)}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                            Active
                          </Badge>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => handleViewEmails(autopilot)}
                          >
                            <Eye className="h-4 w-4" /> View Emails
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => handleManageAutopilot(autopilot)}
                          >
                            <Settings className="h-4 w-4" /> Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create New Autopilot Section */}
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
                    Activate the autopilot by selecting a campaign goal and how many emails to automatically produce and send. Your agent will handle the content creation.
                  </AlertDescription>
                </Alert>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Campaign Goal Selection */}
                    <FormField
                      control={form.control}
                      name="campaignGoalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Goal</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleGoalSelection(value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a campaign offer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {campaignGoals.length > 0 ? (
                                campaignGoals.map((goal) => (
                                  <SelectItem key={goal.id} value={goal.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{goal.offer_name || goal.objetivo}</span>
                                      <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 capitalize">
                                        {goal.style}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>No goals available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {selectedGoal && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-700 mb-2">{selectedGoal.description || selectedGoal.objetivo}</p>
                              {selectedGoal.link && (
                                <FormDescription className="flex items-center text-blue-600">
                                  <Link className="h-4 w-4 mr-1" />
                                  <a 
                                    href={selectedGoal.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="underline hover:text-blue-800"
                                  >
                                    {selectedGoal.link}
                                  </a>
                                </FormDescription>
                              )}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* List selection with multiple checkbox selection */}
                    <FormField
                      control={form.control}
                      name="selectedLists"
                      render={() => (
                        <FormItem>
                          <FormLabel>Select Lists to Send To</FormLabel>
                          <div className="border rounded-md p-4 space-y-3">
                            {lists.length > 0 ? (
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
                                              if (list.hasAutopilot) return; // Prevent checking if already has autopilot
                                              const updatedLists = checked
                                                ? [...field.value, list.id]
                                                : field.value?.filter(
                                                    (value) => value !== list.id
                                                  );
                                              field.onChange(updatedLists);
                                            }}
                                            disabled={list.hasAutopilot}
                                          />
                                        </FormControl>
                                        <div className="flex items-center gap-2">
                                          <FormLabel className={`font-normal ${list.hasAutopilot ? 'text-gray-400' : 'cursor-pointer'}`}>
                                            {list.name}
                                          </FormLabel>
                                          {list.hasAutopilot && (
                                            <div className="flex items-center text-sm text-amber-600">
                                              <AlertCircle className="h-3 w-3 mr-1" />
                                              <span>Already in autopilot</span>
                                            </div>
                                          )}
                                        </div>
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
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="px-8"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </div>
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
          </>
        )}
      </div>
      
      {/* Manage Autopilot Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Email Autopilot</DialogTitle>
            <DialogDescription>
              Update settings for this email autopilot or delete it.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAutopilot && (
            <ManageAutopilotForm 
              autopilot={selectedAutopilot}
              lists={lists}
              campaignGoals={campaignGoals}
              onSuccess={() => {
                setManageDialogOpen(false);
                refreshData();
              }}
              onCancel={() => setManageDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailPlannerPage;
