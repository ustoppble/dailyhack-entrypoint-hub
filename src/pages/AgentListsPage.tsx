
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { EmailList } from '@/lib/api/types';
import LoadingState from '@/components/lists/LoadingState';
import ErrorState from '@/components/lists/ErrorState';

const AgentListsPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [lists, setLists] = useState<EmailList[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        setIsLoading(true);
        
        // Get API URL and token from localStorage (saved during integration)
        const apiUrl = localStorage.getItem('ac_api_url');
        const apiToken = localStorage.getItem('ac_api_token');
        
        if (!apiUrl || !apiToken) {
          throw new Error('ActiveCampaign credentials not found. Please integrate your account first.');
        }
        
        // Webhook URL for fetching lists
        const webhookUrl = 'https://primary-production-2e546.up.railway.app/webhook/62a0cea6-c1c6-48eb-8d76-5c55a270dbbc';
        const url = `${webhookUrl}?api=${encodeURIComponent(apiUrl)}&token=${encodeURIComponent(apiToken)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch lists: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setLists(data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error: any) {
        console.error('Error fetching lists:', error);
        setError(error.message || 'Failed to load email lists');
        toast({
          title: 'Error',
          description: error.message || 'Failed to load email lists',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLists();
  }, [agentName, toast]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center">{agentName} Lists</h1>
          <p className="text-center text-gray-500 mt-2">
            Manage your email lists for {agentName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{list.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Subscribers:</span> {list.active_subscribers}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Sender Reminder:</span> {list.sender_reminder}
                  </p>
                </div>
                <Button variant="outline" className="w-full">
                  Select List
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {lists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">No lists found for this agent.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentListsPage;

