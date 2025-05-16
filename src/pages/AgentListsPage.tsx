
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchConnectedLists } from '@/lib/api/lists';
import LoadingState from '@/components/lists/LoadingState';
import ErrorState from '@/components/lists/ErrorState';
import EmptyState from '@/components/lists/EmptyState';
import EmailListCard from '@/components/lists/EmailListCard';
import { Button } from '@/components/ui/button';
import { ListPlus } from 'lucide-react';

interface ConnectedList {
  id: string;
  name: string;
  subscribers?: string;
}

const AgentListsPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedLists, setConnectedLists] = useState<ConnectedList[]>([]);

  useEffect(() => {
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
    
    loadConnectedLists();
  }, [agentName]);

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
              onRetry={() => window.location.reload()}
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
