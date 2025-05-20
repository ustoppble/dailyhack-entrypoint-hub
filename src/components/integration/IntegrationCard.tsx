
import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { saveSelectedLists } from '@/lib/api/lists';
import { EmailList } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

interface IntegrationCardProps {
  id: string;
  name: string;
  filterMode?: boolean;
  connectedIds?: string[];
  agentName?: string;
}

const IntegrationCard = ({ id, name, filterMode = false, connectedIds = [], agentName }: IntegrationCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Generate a color based on the account name for the avatar
  const generateColor = (accountName: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-yellow-500', 'bg-red-500'
    ];
    
    // Simple hash function to get a consistent color for the same name
    const hash = accountName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const avatarColor = generateColor(name);
  const avatarInitial = name.charAt(0).toUpperCase();
  
  const isConnected = connectedIds.includes(id);

  const handleEnterClick = () => {
    // If in filter mode and the agent name is provided, connect the list to the agent
    if (filterMode && agentName && !isConnected) {
      handleConnect();
      return;
    }
    
    // Store the selected integration ID in localStorage
    localStorage.setItem('selected_integration_id', id);
    localStorage.setItem('selected_integration_name', name);
    
    // Navigate to the agent central page
    navigate(`/agents/${name}/central`);
  };

  const handleConnect = async () => {
    if (!agentName) return;
    
    try {
      // Create a dummy EmailList object with the required fields
      const listToConnect: EmailList = {
        id,
        name,
        sender_reminder: '',
        insight: '',
        active_subscribers: '0'
      };
      
      // Get the user ID from localStorage
      const userId = localStorage.getItem('user_id') || '';
      
      // Save the list as connected to the agent
      await saveSelectedLists(userId, [listToConnect], agentName);
      
      toast({
        title: "List Connected",
        description: `Successfully connected list "${name}" to agent "${agentName}"`,
      });
      
      // Refresh the page to show the updated list
      window.location.reload();
    } catch (error) {
      console.error('Error connecting list:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect the list to the agent.",
        variant: "destructive",
      });
    }
  };

  // Button text based on mode and connection status
  const getButtonContent = () => {
    if (filterMode) {
      return isConnected ? (
        <>
          <Check className="mr-2 h-4 w-4" /> Connected
        </>
      ) : (
        <>
          Connect <ArrowRight className="ml-2" />
        </>
      );
    }
    return (
      <>
        ENTER <ArrowRight className="ml-2" />
      </>
    );
  };

  // Button style and disabled state
  const buttonVariant = filterMode && isConnected ? "secondary" : "default";
  const isDisabled = filterMode && isConnected;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-col items-center pt-6 pb-3">
        <Avatar className={`h-16 w-16 ${avatarColor} text-white`}>
          <AvatarFallback className="text-xl font-bold">
            {avatarInitial}
          </AvatarFallback>
        </Avatar>
        <h3 className="mt-3 text-center text-lg font-medium">{name}</h3>
      </CardHeader>
      
      <CardContent className="text-sm text-gray-600 text-center pb-3">
        <p>ActiveCampaign Agent</p>
      </CardContent>
      
      <CardFooter className="flex justify-center pb-4">
        <Button
          variant={buttonVariant}
          onClick={handleEnterClick}
          className="w-full"
          disabled={isDisabled}
        >
          {getButtonContent()}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default IntegrationCard;
