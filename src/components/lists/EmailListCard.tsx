
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EmailList } from '@/lib/api/types';
import { Users } from "lucide-react";

interface EmailListCardProps {
  list: EmailList;
  selected: boolean;
  onSelect: (listName: string, isSelected: boolean) => void;
}

const EmailListCard = ({ list, selected, onSelect }: EmailListCardProps) => {
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
  
  const avatarColor = generateColor(list.name);
  const avatarInitial = list.name.charAt(0).toUpperCase();
  
  return (
    <Card className={`relative transition-all ${selected ? 'border-blue-500 border-2 shadow-md' : 'border-gray-200'}`}>
      <div className="absolute right-3 top-3">
        <Checkbox 
          checked={selected} 
          onCheckedChange={(checked) => onSelect(list.name, checked === true)}
        />
      </div>
      
      <CardHeader className="flex flex-col items-center pt-6 pb-3">
        <Avatar className={`h-16 w-16 ${avatarColor} text-white`}>
          <AvatarFallback className="text-xl font-bold">
            {avatarInitial}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="mt-3 text-center text-lg">{list.name}</CardTitle>
        <Badge variant="outline" className="flex items-center gap-1 mt-2">
          <Users className="h-3 w-3" />
          {list.active_subscribers}
        </Badge>
      </CardHeader>
      
      <CardContent className="text-sm text-gray-600 pb-3">
        <div className="mb-2">
          <span className="font-medium text-gray-800">Lembrete do remetente:</span>
          <p className="italic">"{list.sender_reminder}"</p>
        </div>
        <div className="mt-3">
          <span className="font-medium text-gray-800">Insight:</span>
          <p className="text-xs">{list.insight}</p>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 justify-center">
        <p className="text-xs text-gray-500 text-center">
          Clique para selecionar esta lista
        </p>
      </CardFooter>
    </Card>
  );
};

export default EmailListCard;
