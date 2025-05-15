
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import IntegrationCard from '@/components/integration/IntegrationCard';

interface IntegrationGridProps {
  integrations: {id: string, api: string}[];
  onAddNew: () => void;
}

const IntegrationGrid = ({ integrations, onAddNew }: IntegrationGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          id={integration.id}
          name={integration.api}
        />
      ))}
      <Card className="flex flex-col items-center justify-center border-dashed h-full min-h-[240px]">
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={onAddNew}
        >
          <Plus className="h-4 w-4" />
          Add New Agent
        </Button>
      </Card>
    </div>
  );
};

export default IntegrationGrid;
