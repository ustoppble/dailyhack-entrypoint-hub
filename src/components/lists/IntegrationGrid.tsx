
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import IntegrationCard from '@/components/integration/IntegrationCard';
import { fetchConnectedLists } from '@/lib/api/lists';

interface IntegrationGridProps {
  integrations: {id: string, api: string}[];
  onAddNew: () => void;
  agentFilter?: string | null;
}

const IntegrationGrid = ({ integrations, onAddNew, agentFilter = null }: IntegrationGridProps) => {
  const [connectedListIds, setConnectedListIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadConnectedLists = async () => {
      if (!agentFilter) return;
      
      try {
        setIsLoading(true);
        const lists = await fetchConnectedLists(agentFilter);
        const listIds = lists.map(list => list.id);
        setConnectedListIds(listIds);
        console.log("Connected list IDs:", listIds);
      } catch (err) {
        console.error('Error loading connected lists for filtering:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConnectedLists();
  }, [agentFilter]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          id={integration.id}
          name={integration.api}
          filterMode={agentFilter ? true : false}
          connectedIds={connectedListIds}
          agentName={agentFilter || undefined}
        />
      ))}
      <Card className="flex flex-col items-center justify-center border-dashed h-full min-h-[240px] p-6">
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
