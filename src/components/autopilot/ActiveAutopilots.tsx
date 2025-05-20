
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Eye, Settings, Tag, Link as LinkIcon } from 'lucide-react';
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
    // Updated to match the route pattern in App.tsx
    navigate(`/agents/${agentName}/list/${autopilot.listId}/emails`);
  };

  const getOfferInfo = (offerId?: string | number) => {
    if (!offerId || !campaignGoals || campaignGoals.length === 0) {
      return { name: '', link: '', style: 'nutring' };
    }
    
    const goal = campaignGoals.find(g => g.id === offerId || g.id_offer === Number(offerId));
    
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
