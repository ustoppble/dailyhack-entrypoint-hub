import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, Settings, Tag, Link as LinkIcon, Trash2 } from 'lucide-react';
import { AutopilotRecord } from '@/lib/api/autopilot';
import { CampaignGoal } from '@/lib/api/goals';
import { toast } from '@/hooks/use-toast';
import { airtableAutopilotTasksApi, airtableTasksApi } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';

interface ActiveAutopilotsProps {
  autopilotData: AutopilotRecord[];
  onManageAutopilot: (autopilot: AutopilotRecord) => void;
  agentName: string;
  campaignGoals?: CampaignGoal[];
}

const ActiveAutopilots: React.FC<ActiveAutopilotsProps> = ({ 
  autopilotData, 
  onManageAutopilot,
  agentName,
  campaignGoals = [] 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const getFrequencyText = (cronId: number): string => {
    return cronId === 1 ? "1 email per day (08h)" : "2 emails per day (08h and 20h)";
  };
  
  const handleViewEmails = (autopilot: AutopilotRecord) => {
    console.log(`Navigating to list emails for agent ${agentName} and list ID ${autopilot.listId}`);
    // Updated to match the route pattern in App.tsx
    navigate(`/agents/${agentName}/list/${autopilot.listId}/emails`);
  };

  const handleDeleteTask = async (autopilot: AutopilotRecord) => {
    if (!user || !user.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to delete tasks.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // First, get all tasks for this autopilot
      const tasksResponse = await airtableAutopilotTasksApi.get('', {
        params: {
          filterByFormula: `{id_autopilot}='${autopilot.id}'`
        }
      });
      
      const tasks = tasksResponse.data.records;
      if (!tasks || tasks.length === 0) {
        toast({
          title: "No tasks found",
          description: "No tasks found for this autopilot.",
          variant: "destructive"
        });
        return;
      }
      
      // For each task, find and delete its emails first
      for (const task of tasks) {
        const taskId = task.fields.id_autopilot_task;
        if (taskId) {
          // Get all emails with this task ID
          const emailsResponse = await airtableTasksApi.get('', {
            params: {
              filterByFormula: `{id_autopilot_task}='${taskId}'`
            }
          });
          
          const emails = emailsResponse.data.records;
          
          // Delete each email
          for (const email of emails) {
            await airtableTasksApi.delete(`/${email.id}`);
          }
          
          console.log(`Deleted ${emails.length} emails for task ID ${taskId}`);
        }
        
        // Delete the task itself
        await airtableAutopilotTasksApi.delete(`/${task.id}`);
      }
      
      toast({
        title: "Tasks deleted",
        description: `Successfully deleted ${tasks.length} tasks and their associated emails.`,
      });
      
      // Refresh the page to show updated data
      window.location.reload();
      
    } catch (error) {
      console.error('Error deleting tasks:', error);
      toast({
        title: "Error deleting tasks",
        description: "An error occurred while deleting tasks.",
        variant: "destructive"
      });
    }
  };

  const getOfferInfo = (offerId?: string | number) => {
    if (!offerId || !campaignGoals || campaignGoals.length === 0) {
      return { name: '', link: '', style: 'nutring' };
    }
    
    // First try to find by offerId string (Airtable record ID)
    let goal = campaignGoals.find(g => g.id === offerId);
    
    // If not found, try to find by numeric id_offer
    if (!goal) {
      goal = campaignGoals.find(g => g.id_offer === Number(offerId));
    }
    
    if (goal) {
      return {
        name: goal.offer_name || goal.goal || '',
        link: goal.link || '',
        style: goal.style || 'nutring'
      };
    }
    
    return { name: '', link: '', style: 'nutring' };
  };
  
  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    } else {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Paused</Badge>;
    }
  };
  
  if (autopilotData.length === 0) {
    return null;
  }
  
  return (
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
          {autopilotData.map((autopilot) => {
            const offerInfo = getOfferInfo(autopilot.offerId);
            
            return (
              <div key={autopilot.id} className="border rounded-md p-4 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">
                      {autopilot.listName || `List #${autopilot.listId}`}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">
                      {getFrequencyText(autopilot.cronId)}
                    </p>
                    {offerInfo.name && (
                      <div className="flex items-center mt-1 text-blue-700">
                        <Tag className="h-4 w-4 mr-1.5" />
                        <span className="font-medium">{offerInfo.name}</span>
                      </div>
                    )}
                    {offerInfo.link && (
                      <div className="flex items-center mt-1 text-blue-600">
                        <LinkIcon className="h-4 w-4 mr-1.5" />
                        <a 
                          href={offerInfo.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline hover:text-blue-800"
                        >
                          {offerInfo.link}
                        </a>
                      </div>
                    )}
                    {offerInfo.style && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-gray-100 capitalize">
                        {offerInfo.style}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(autopilot.status || 0)}
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
                    className="gap-1 border-red-500 text-red-500 hover:bg-red-50"
                    onClick={() => handleDeleteTask(autopilot)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete Tasks
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => onManageAutopilot(autopilot)}
                  >
                    <Settings className="h-4 w-4" /> Manage
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveAutopilots;
