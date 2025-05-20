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
import PageHeader from '@/components/autopilot/PageHeader';
import { useAuth } from '@/contexts/AuthContext'; // Add this import

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
  const { user } = useAuth(); // Add this to get the user

  useEffect(() => {
    loadConnectedLists();
  }, [agentName, user?.id]); // Add user?.id as a dependency
  
  const loadConnectedLists = async () => {
    if (!agentName) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Pass user ID when fetching connected lists
      const lists = await fetchConnectedLists(agentName, user?.id);
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
      
      toast({
        title: "Success",
        description: "List successfully removed",
      });
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
      {agentName && <PageHeader agentName={agentName} />}
      
      <div className="max-w-5xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-bold">
              Connected Lists for {agentName}
            </CardTitle>
            <Button asChild variant="outline" className="flex items-center gap-2">
              <Link to={`/agents/${agentName}/fetch-lists`}>
                <ListPlus className="h-4 w-4" /> Connect More Lists
              </Link>
            </Button>
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
                actionUrl={`/agents/${agentName}/fetch-lists`}
                actionLabel="Connect Lists"
              />
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
};

export default AgentListsPage;
