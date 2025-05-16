
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchConnectedLists, deleteConnectedList } from '@/lib/api/lists';
import LoadingState from '@/components/lists/LoadingState';
import ErrorState from '@/components/lists/ErrorState';
import EmptyState from '@/components/lists/EmptyState';
import EmailListCard from '@/components/lists/EmailListCard';
import { Button } from '@/components/ui/button';
import { ListPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectedList {
  id: string;
  name: string;
  subscribers?: string;
  airtableId?: string;
}

const AgentListsPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedLists, setConnectedLists] = useState<ConnectedList[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadConnectedLists();
  }, [agentName]);
  
  const loadConnectedLists = async () => {
    if (!agentName) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const lists = await fetchConnectedLists(agentName);
      console.log('Fetched lists:', lists);
      setConnectedLists(lists);
    } catch (err) {
      console.error('Error loading connected lists:', err);
      setError('Failed to load connected lists. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async (airtableRecordId: string) => {
    if (!airtableRecordId) {
      toast({
        title: "Error",
        description: "Unable to identify the list record to delete.",
        variant: "destructive"
      });
      return;
    }

    try {
      await deleteConnectedList(airtableRecordId);
      
      // Update the local state to remove the deleted list
      setConnectedLists(prev => prev.filter(list => list.airtableId !== airtableRecordId));
    } catch (err) {
      console.error('Error deleting list:', err);
      toast({
        title: "Error",
        description: "Failed to remove the list. Please try again.",
        variant: "destructive"
      });
      throw err; // Re-throw to handle in the component
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Connected Lists for {agentName}</span>
            <Button asChild variant="outline" className="flex items-center gap-2">
              <Link to={`/lists/fetch/${agentName}`}>
                <ListPlus className="h-4 w-4" /> Connect More Lists
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState 
              error={error} 
              onRetry={loadConnectedLists}
            />
          ) : connectedLists.length === 0 ? (
            <EmptyState 
              message={`You haven't connected any lists for ${agentName} yet.`}
              actionUrl={`/lists/fetch/${agentName}`}
              actionLabel="Connect Lists"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connectedLists.map((list) => (
                <EmailListCard
                  key={list.id}
                  list={{
                    id: list.id,
                    name: list.name,
                    active_subscribers: list.subscribers || "0",
                    insight: "",
                  }}
                  isConnected={true}
                  agentName={agentName}
                  onDelete={list.airtableId ? 
                    () => handleDeleteList(list.airtableId!) : 
                    undefined
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentListsPage;
