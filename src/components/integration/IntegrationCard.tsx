
import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface IntegrationCardProps {
  id: string;
  name: string;
}

const IntegrationCard = ({ id, name }: IntegrationCardProps) => {
  const navigate = useNavigate();
  
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
  
  const handleEnterClick = () => {
    // Store the selected integration ID in localStorage
    localStorage.setItem('selected_integration_id', id);
    localStorage.setItem('selected_integration_name', name);
    
    // Navigate to the lists page for this integration
    navigate(`/lists/${id}`);
  };

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
        <Button onClick={handleEnterClick} className="w-full">
          MANAGE <ArrowRight className="ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default IntegrationCard;
