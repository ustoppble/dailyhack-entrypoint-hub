
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  message?: string;
  onAddNew?: () => void;
  actionUrl?: string;
  actionLabel?: string;
}

const EmptyState = ({ 
  message = "No ActiveCampaign agents found.", 
  onAddNew, 
  actionUrl, 
  actionLabel = "Connect" 
}: EmptyStateProps) => {
  // If both actionUrl and onAddNew are provided, use actionUrl (link takes precedence)
  const renderButton = () => {
    if (actionUrl) {
      return (
        <Button asChild className="mt-4">
          <Link to={actionUrl}>
            <Plus className="mr-2 h-4 w-4" />
            {actionLabel}
          </Link>
        </Button>
      );
    }
    
    if (onAddNew) {
      return (
        <Button className="mt-4" onClick={onAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          {actionLabel || "Add New Agent"}
        </Button>
      );
    }
    
    return null;
  };
  
  return (
    <div className="text-center py-12">
      <p className="text-gray-600">{message}</p>
      <p className="text-sm text-gray-500 mt-2">
        Click the button below to connect lists.
      </p>
      {renderButton()}
    </div>
  );
};

export default EmptyState;
