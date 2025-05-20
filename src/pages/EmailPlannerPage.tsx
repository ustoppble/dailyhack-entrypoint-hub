import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PlayCircle } from 'lucide-react'; // Removed CalendarIcon import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button'; // Import Button from shadcn UI
import StatusMessage from '@/components/integration/StatusMessage';
import LoadingState from '@/components/lists/LoadingState';
import axios from 'axios';
import { 
  fetchConnectedLists, 
  createAutopilotRecord, 
  fetchAutopilotRecords,
  AutopilotRecord,
  fetchCampaignGoals,
  CampaignGoal,
  checkExistingAutopilot,
  createAutopilotTask
} from '@/lib/api-service';
import { airtableUpdatesApi } from '@/lib/api/client';

// Import our components
import PageHeader from '@/components/autopilot/PageHeader';
import ActiveAutopilots from '@/components/autopilot/ActiveAutopilots';
import EmailPlannerForm from '@/components/autopilot/EmailPlannerForm';
import SuccessCard from '@/components/autopilot/SuccessCard';
import ManageAutopilotForm from '@/components/autopilot/ManageAutopilotForm';

// List item interface with id and name
interface ListItem {
  id: string;
  name: string;
  hasAutopilot?: boolean;
  list_id?: string; // Add list_id field to store the actual list_id from ActiveCampaign
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
  
  // Dialog state for manage and view emails
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedAutopilot, setSelectedAutopilot] = useState<AutopilotRecord | null>(null);
  
  // Handle clicking manage button for an autopilot
  const handleManageAutopilot = (autopilot: AutopilotRecord) => {
    setSelectedAutopilot(autopilot);
    setManageDialogOpen(true);
  };
  
  // Refresh data after changes
  const refreshData = async () => {
    if (!agentName) return;
    
    try {
      setIsLoading(true);
      setDataReady(false);
      
      const userId = user?.id ? Number(user.id) : undefined;
      
      // Fetch all data before displaying anything
      const [autopilotRecords, connectedLists, goals] = await Promise.all([
        fetchAutopilotRecords(agentName, userId), // Pass user ID when fetching autopilot records
        fetchConnectedLists(agentName, user?.id ? user.id.toString() : undefined),
        fetchCampaignGoals(agentName, user?.id ? user.id.toString() : undefined)
      ]);
      
      // Enhance autopilot records with list names
      const enhancedAutopilotRecords = autopilotRecords.map(record => ({
        ...record,
        listName: connectedLists.find(l => l.list_id === record.listId.toString())?.name
      }));
      
      setAutopilotData(enhancedAutopilotRecords);
      console.log('Autopilot records:', enhancedAutopilotRecords);
      console.log('Campaign goals for offer display:', goals);
      
      // Mark lists that already have autopilot
      const listsWithAutopilotStatus = connectedLists.map(list => ({
        ...list,
        hasAutopilot: autopilotRecords.some(record => 
          record.listId === Number(list.list_id))
      }));
      
      setLists(listsWithAutopilotStatus);
      setCampaignGoals(goals);
      
      // Only now we mark data as ready
      setDataReady(true);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load lists or offers data");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshData();
  }, [agentName, user?.id]);
  
  // Function to handle starting email production
  const handleStartProduction = async () => {
    if (!user || !user.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to start production",
        variant: "destructive"
      });
      return;
    }

    if (!agentName || !autopilotData.length) {
      toast({
        title: "Missing Information",
        description: "Agent name or autopilot data not found",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the numeric user ID
      const userId = Number(user.id);
      
      // Loop through each autopilot for this agent
      for (const autopilot of autopilotData) {
        // Step 1: Create a new task record
        const autopilotId = Number(autopilot.id_autopilot || autopilot.id);
        
        try {
          // Create a new autopilot task using the improved function
          // This ensures status is sent as a number 0 instead of string "0"
          const taskResult = await createAutopilotTask(autopilotId, userId);
          
          if (!taskResult.success || !taskResult.taskId) {
            console.error('Failed to create task record');
            continue;
          }
          
          // Extract the task ID from the response
          const taskId = taskResult.taskId;
          
          // Find the corresponding campaign goal for this autopilot
          const targetGoal = campaignGoals.find(goal => {
            // Match by id_offer if available
            if (autopilot.offerId && goal.id_offer) {
              return Number(autopilot.offerId) === Number(goal.id_offer);
            }
            return false;
          });
          
          if (!targetGoal) {
            console.error('Campaign goal not found for autopilot:', autopilotId);
            continue;
          }
          
          // Step 2: Send webhook POST request with required data
          // Webhook URL for triggering production
          const webhookUrl = 'https://primary-production-2e546.up.railway.app/webhook/62eb5369-3119-41d2-a923-eb2aea9bd0df';
          
          // Determine email frequency based on cron ID
          const emailFrequency = autopilot.cronId === 1 ? "once" : "twice";
          
          // Create the payload according to the required format
          const requestData = {
            agentName: agentName, // From the URL parameter
            lists: [Number(autopilot.listId)], // Convert to array of numbers
            userId: userId, // From the user context
            id_autopilot: autopilotId, // From the autopilot record
            id_autopilot_task: taskId, // From the newly created task
            goal: targetGoal.goal, // From the campaign goal
            offer_name: targetGoal.offer_name, // From the campaign goal
            emailFrequency: emailFrequency, // Based on cronId
            // Include any additional required fields
            next_update: autopilot.next_update, 
            action: "production", // Specify this is a production request
            forceUpdate: true
          };
          
          console.log('Starting new email production with payload:', requestData);
          
          // Send request to webhook
          const response = await axios.post(webhookUrl, requestData);
          console.log('Production webhook response:', response.data);
        } catch (err) {
          console.error(`Error processing autopilot ${autopilot.id}:`, err);
        }
      }
      
      toast({
        title: "Production Started",
        description: "New email production has been initiated",
      });
      
      // Refresh data to show any changes
      await refreshData();
      
    } catch (err: any) {
      console.error('Error starting email production:', err);
      toast({
        title: "Production Error",
        description: err.message || "Failed to start email production",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: any) => {
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
    
    // Make sure we have a valid offer
    const selectedGoalData = campaignGoals.find(g => g.id === values.campaignGoalId);
    if (!selectedGoalData) {
      toast({
        title: "Error",
        description: "Please select a valid offer",
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
      const selectedListNames = values.selectedLists.map((listId: string) => {
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
        
        // Get the list from the lists object
        const selectedList = lists.find(list => list.id === listId);
        if (!selectedList) {
          console.error(`List with ID ${listId} not found`);
          continue;
        }
        
        // Use the list_id from the selected list
        const activeListId = selectedList.list_id || listId;
        console.log(`Using list_id ${activeListId} for list ${selectedList.name}`);
        
        // Calculate next update date - 7 days from now at midnight
        const nextUpdateDate = new Date();
        nextUpdateDate.setDate(nextUpdateDate.getDate() + 7);
        nextUpdateDate.setHours(0, 0, 0, 0);
        const nextUpdateString = nextUpdateDate.toISOString();
        
        // Create record in Airtable autopilot table
        const cronId = values.emailFrequency === "once" ? 1 : 2;
        
        // Check if an autopilot already exists for this list and schedule
        const existingAutopilot = await checkExistingAutopilot(activeListId, cronId, agentName || '');
        if (existingAutopilot) {
          console.error(`Autopilot already exists for list ${activeListId} with cron ${cronId}`);
          toast({
            title: "Autopilot already exists",
            description: `An email autopilot already exists for "${selectedList.name}" with the same schedule`,
            variant: "destructive",
          });
          continue;
        }
        
        console.log("Creating autopilot record with next_update:", nextUpdateString);
        
        // Use the id_offer field from the campaign goal
        // Make sure it's a number as expected by the Airtable schema
        const offerId = selectedGoalData.id_offer || 0;
        console.log(`Using offer ID ${offerId} from selected campaign goal:`, selectedGoalData);
        
        // First, create the autopilot record with next_update field and user ID
        try {
          // Ensure we have the user ID
          if (!user.id) {
            console.error("User ID is missing");
            throw new Error("User ID is required to create an autopilot");
          }
          
          // Log the user ID for debugging
          console.log("Using user ID for autopilot creation:", user.id);
          
          const autopilotResponse = await airtableUpdatesApi.post('', {
            records: [
              {
                fields: {
                  id_list: Number(activeListId),
                  url: agentName,
                  id_cron: cronId,
                  id_offer: offerId,
                  next_update: nextUpdateString,
                  status: 1, // Set status to active (1) as a number
                  id_user: Number(user.id) // Ensure user ID is a number
                }
              }
            ]
          });
          
          console.log("Autopilot record created:", autopilotResponse.data);
          
          // Get the autopilot ID from the response
          const autopilotId = autopilotResponse.data.records[0].fields.id_autopilot;
          
          // Create task using our improved createAutopilotTask function that uses number for status
          const taskResult = await createAutopilotTask(autopilotId, Number(user.id));
          
          if (!taskResult.success || !taskResult.taskId) {
            console.error("Failed to create autopilot task");
            throw new Error("Failed to create autopilot task");
          }
          
          console.log("Autopilot task created:", taskResult);
          
          // Get the task ID from the response
          const taskId = taskResult.taskId;
          
          // Prepare data to send to webhook - one list per request
          const requestData = {
            agentName,
            lists: [Number(activeListId)], // Use the actual list_id here as a number
            userId: Number(user.id), // Ensure user ID is a number
            id_autopilot: autopilotId,
            id_autopilot_task: taskId, // Include the autopilot task ID in the webhook payload
            mainGoal: selectedGoalData.goal || '', // Use goal field
            goal: selectedGoalData.goal || '',
            offer_name: selectedGoalData.offer_name || '',
            emailFrequency: values.emailFrequency,
            goalLink: selectedGoalData.link || '',
            goalStyle: selectedGoalData.style || 'nutring'
          };
          
          // Log the webhook data being sent for debugging
          console.log('Sending webhook data:', requestData);
          
          // Send the form data to the specified webhook for this list
          const response = await axios.post(webhookUrl, requestData);
          console.log(`Webhook response for list ${listId}:`, response.data);
          
        } catch (err) {
          console.error("Error creating records or sending webhook:", err);
          throw err;
        }
      }
      
      const emailFrequencyText = values.emailFrequency === "once" ? "1 email per day (08h)" : "2 emails per day (08h and 20h)";
      const successMessage = `Your email campaign "${selectedGoalData.offer_name || selectedGoalData.goal}" is now in production! ${emailFrequencyText} will be sent to ${selectedListNames.join(", ")}.`;
      
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
        {agentName && <PageHeader agentName={agentName} />}
        
        <StatusMessage error={error} success={success} />
        
        {success ? (
          <SuccessCard success={success} agentName={agentName || ''} />
        ) : isLoading || !dataReady ? (
          <LoadingState text="Loading and validating lists..." />
        ) : (
          <>
            {/* Active Autopilots Section */}
            {autopilotData.length > 0 && (
              <ActiveAutopilots 
                autopilotData={autopilotData}
                onManageAutopilot={handleManageAutopilot}
                agentName={agentName || ''}
                campaignGoals={campaignGoals}
              />
            )}

            {/* Production Button - Removed calendar info about next update */}
            {autopilotData.length > 0 && (
              <div className="mb-6">
                <div className="bg-white rounded-lg shadow-sm border p-4 flex justify-end">
                  <Button
                    variant="default"
                    onClick={handleStartProduction}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {isSubmitting ? 'Starting...' : 'Start Production Now'}
                  </Button>
                </div>
              </div>
            )}

            {/* Create New Autopilot Section */}
            <EmailPlannerForm 
              campaignGoals={campaignGoals}
              lists={lists}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              agentName={agentName || ''}
            />
          </>
        )}
      </div>
      
      {/* Manage Autopilot Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Email Autopilot</DialogTitle>
            <DialogDescription>
              Delete this email autopilot campaign.
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
