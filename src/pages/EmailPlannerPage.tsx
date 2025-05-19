
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import StatusMessage from '@/components/integration/StatusMessage';
import LoadingState from '@/components/lists/LoadingState';
import axios from 'axios';
import { 
  fetchConnectedLists, 
  createAutopilotRecord, 
  fetchAutopilotRecords,
  AutopilotRecord,
  fetchCampaignGoals,
  CampaignGoal
} from '@/lib/api-service';

// Import our new components
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
              />
            )}

            {/* Create New Autopilot Section */}
            <EmailPlannerForm 
              campaignGoals={campaignGoals}
              lists={lists}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
            />
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
