
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchConnectedLists } from '@/lib/api/lists';
import LoadingState from '@/components/lists/LoadingState';
import ErrorState from '@/components/lists/ErrorState';
import EmptyState from '@/components/lists/EmptyState';
import EmailListCard from '@/components/lists/EmailListCard';

const AgentListsPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fix the type here to match what fetchConnectedLists returns
  const [connectedLists, setConnectedLists] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadConnectedLists = async () => {
      if (!agentName) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const lists = await fetchConnectedLists(agentName);
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Loading connected lists..." />
          ) : error ? (
            <ErrorState message={error} retry={() => window.location.reload()} />
          ) : connectedLists.length === 0 ? (
            <EmptyState 
              title="No Connected Lists" 
              description={`You haven't connected any lists for ${agentName} yet.`}
              actionHref={`/lists`}
              actionText="Connect Lists"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connectedLists.map((list) => (
                <EmailListCard
                  key={list.id}
                  title={list.name}
                  description=""
                  subscriberCount={0}
                  isSelected={false}
                  onSelect={() => {}}
                  listId={list.id}
                  insight=""
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
