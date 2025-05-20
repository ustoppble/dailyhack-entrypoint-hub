import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EmailList } from '@/lib/api/types';
import { Users, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { saveSelectedLists } from '@/lib/api/lists';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

interface EmailListCardProps {
  list: EmailList | Partial<EmailList>;
  selected?: boolean;
  onToggleSelect?: (listId: string, isSelected: boolean) => void;
  onSelect?: (listName: string, isSelected: boolean) => void;
  agentName?: string;
  isConnected?: boolean;
  onDelete?: () => Promise<void>;
  airtableRecordId?: string;
}

const EmailListCard = ({ 
  list, 
  selected = false, 
  onToggleSelect, 
  onSelect, 
  agentName,
  isConnected = false,
  onDelete,
  airtableRecordId
}: EmailListCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Generate a color based on the list name for the avatar
  const generateColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-yellow-500', 'bg-red-500'
    ];
    
    // Simple hash function to get a consistent color for the same name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const name = list.name || "Unknown List";
  const avatarColor = generateColor(name);
  const avatarInitial = name.charAt(0).toUpperCase();
  const subscriberCount = list.active_subscribers || "0";
  
  const handleCheckedChange = (checked: boolean) => {
    if (onToggleSelect && list.id) {
      onToggleSelect(list.id, checked);
    } else if (onSelect && list.name) {
      onSelect(list.name, checked);
    }
  };

  const handleConnectList = async () => {
    if (!list.id || !agentName) return;
    
    try {
      setIsConnecting(true);
      // Make sure we have a user ID
      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "You need to be logged in to connect lists.",
          variant: "destructive"
        });
        return;
      }
      
      // Simply pass the user ID directly - it will be converted to a number in the API
      const userId = user.id;
      console.log('Connecting list with user ID:', userId);
      
      const success = await saveSelectedLists(userId, [list as EmailList], agentName);
      
      if (success) {
        toast({
          title: "List connected successfully",
          description: `"${name}" has been connected to ${agentName}`,
        });
        
        // Refresh the page after successful connection
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error('Error connecting list:', err);
      toast({
        title: "Failed to connect list",
        description: "There was an error connecting the list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!onDelete) return;

    try {
      setIsDeleting(true);
      await onDelete();
      toast({
        title: "List removed successfully",
        description: `"${name}" has been removed from ${agentName}`,
      });
    } catch (err) {
      console.error('Error deleting list:', err);
      toast({
        title: "Failed to remove list",
        description: "There was an error removing the list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Card className={`relative h-full flex flex-col transition-all ${selected ? 'border-blue-500 border-2 shadow-md' : 'border-gray-200'}`}>
      {(onToggleSelect || onSelect) && (
        <div className="absolute right-3 top-3">
          <Checkbox 
            checked={selected} 
            onCheckedChange={(checked) => handleCheckedChange(checked === true)}
          />
        </div>
      )}
      
      <CardHeader className="flex flex-col items-center pt-6 pb-3">
        <Avatar className={`h-16 w-16 ${avatarColor} text-white`}>
          <AvatarFallback className="text-xl font-bold">
            {avatarInitial}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="mt-3 text-center text-lg">{name}</CardTitle>
        <Badge variant="outline" className="flex items-center gap-1 mt-2">
          <Users className="h-3 w-3" />
          {subscriberCount}
        </Badge>
      </CardHeader>
      
      <CardContent className="text-sm text-gray-600 pb-3 flex-grow">
        {list.sender_reminder && (
          <div className="mb-2">
            <span className="font-medium text-gray-800">Lembrete do remetente:</span>
            <p className="italic">"{list.sender_reminder}"</p>
          </div>
        )}
        {list.insight && (
          <div className="mt-3">
            <span className="font-medium text-gray-800">Insight:</span>
            <p className="text-xs">{list.insight}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex flex-col gap-2">
        {agentName && !isConnected && (
          <Button 
            onClick={handleConnectList} 
            variant="outline" 
            size="sm"
            className="w-full"
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : `Connect to ${agentName}`}
          </Button>
        )}
        {isConnected && onDelete && (
          <Button 
            onClick={handleDeleteClick} 
            variant="destructive" 
            size="sm"
            className="w-full"
            disabled={isDeleting}
          >
            <Trash className="h-4 w-4 mr-2" />
            {isDeleting ? 'Removing...' : 'Remove List'}
          </Button>
        )}
        {(onToggleSelect || onSelect) && !agentName && !isConnected ? (
          <p className="text-xs text-gray-500 text-center">
            Click to select this list
          </p>
        ) : (agentName && isConnected && !onDelete) && (
          <p className="text-xs text-gray-500 text-center">
            Connected list
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default EmailListCard;
