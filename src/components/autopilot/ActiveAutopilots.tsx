
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, Settings } from 'lucide-react';
import { AutopilotRecord } from '@/lib/api/autopilot';
import { CampaignGoal } from '@/lib/api/goals';

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
  
  const getFrequencyText = (cronId: number): string => {
    return cronId === 1 ? "1 email per day (08h)" : "2 emails per day (08h and 20h)";
  };
  
  const handleViewEmails = (autopilot: AutopilotRecord) => {
    console.log(`Navigating to list emails for agent ${agentName} and list ID ${autopilot.listId}`);
    navigate(`/agents/${agentName}/list-emails/${autopilot.listId}`);
  };

  const getOfferName = (offerId?: string): string => {
    if (!offerId || !campaignGoals || campaignGoals.length === 0) return '';
    
    const goal = campaignGoals.find(g => g.id === offerId);
    return goal ? goal.offer_name || '' : '';
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
          {autopilotData.map((autopilot) => (
            <div key={autopilot.id} className="border rounded-md p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">
                    {autopilot.listName || `List #${autopilot.listId}`}
                  </h3>
                  <p className="text-sm text-gray-500 mb-1">
                    {getFrequencyText(autopilot.cronId)}
                  </p>
                  {autopilot.offerId && (
                    <p className="text-xs text-blue-600">
                      <span className="font-medium">Campaign:</span> {getOfferName(autopilot.offerId)}
                    </p>
                  )}
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
                  onClick={() => onManageAutopilot(autopilot)}
                >
                  <Settings className="h-4 w-4" /> Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveAutopilots;
