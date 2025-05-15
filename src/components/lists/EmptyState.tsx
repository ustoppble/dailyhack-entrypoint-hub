
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  onAddNew: () => void;
}

const EmptyState = ({ onAddNew }: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <p className="text-gray-600">No ActiveCampaign accounts found.</p>
      <p className="text-sm text-gray-500 mt-2">
        Please add an integration to get started.
      </p>
      <Button 
        className="mt-4" 
        onClick={onAddNew}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New Integration
      </Button>
    </div>
  );
};

export default EmptyState;
