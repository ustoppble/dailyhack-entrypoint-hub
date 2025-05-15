
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { EmailList } from '@/lib/api/types';
import LoadingState from '@/components/lists/LoadingState';
import ErrorState from '@/components/lists/ErrorState';
import { fetchEmailLists } from '@/lib/api/lists';
import { airtableIntegrationApi } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';

const AgentListsPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [lists, setLists] = useState<EmailList[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        setIsLoading(true);
        
        if (!user) {
          throw new Error('You need to be logged in to access this page');
        }
        
        if (!agentName) {
          throw new Error('Agent name is missing');
        }
        
        console.log('Fetching lists for agent:', agentName);
        
        // First, get the integration record for this specific agent from Airtable
        const filterByFormula = encodeURIComponent(`AND({id_users}='${user.id}', {api}='${agentName}')`);
        const integrationResponse = await airtableIntegrationApi.get(`?filterByFormula=${filterByFormula}`);
        
        console.log('Integration response for agent:', integrationResponse.data);
        
        if (!integrationResponse.data?.records || integrationResponse.data.records.length === 0) {
          throw new Error(`Integration for agent "${agentName}" not found`);
        }
        
        const integration = integrationResponse.data.records[0];
        const apiToken = integration.fields.token;
        const apiUrl = `https://${agentName}.api-us1.com`;
        
        console.log('Using API URL:', apiUrl);
        
        // Use the fetchEmailLists function with the correct agent credentials
        const listsData = await fetchEmailLists(apiUrl, apiToken);
        setLists(listsData);
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
  }, [agentName, toast, user]);

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
