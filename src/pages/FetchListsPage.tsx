
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, List } from 'lucide-react';
import { fetchEmailLists, fetchConnectedLists } from '@/lib/api/lists';
import { EmailList } from '@/lib/api/types';
import LoadingState from '@/components/lists/LoadingState';
import EmailListCard from '@/components/lists/EmailListCard';
import { fetchUserIntegrations, fetchIntegrationByUserAndAgent } from '@/lib/api/integration';
import { useAuth } from '@/contexts/AuthContext';

const FetchListsPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState<EmailList[]>([]);
  const [connectedListIds, setConnectedListIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [apiToken, setApiToken] = useState<string>('');
  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [connectedListsLoading, setConnectedListsLoading] = useState(true);

  // Load integration details from Airtable when component loads
  useEffect(() => {
    if (!agentName || !user?.id) {
      setError("User not authenticated or agent name missing");
      setIntegrationLoading(false);
      return;
    }
    
    const loadIntegrationDetails = async () => {
      try {
        setIntegrationLoading(true);
        
        // Fetch integration specifically for this user and agent
        console.log(`Fetching integration for user ${user.id} and agent ${agentName}`);
        const integration = await fetchIntegrationByUserAndAgent(user.id, agentName);
        
        if (integration && integration.token) {
          // Use the API token from Airtable
          console.log(`Found integration with token for ${agentName}`);
          
          // Format the API URL based on the agent name
          const formattedApiUrl = `https://${agentName}.api-us1.com`;
          setApiUrl(formattedApiUrl);
          setApiToken(integration.token);
        } else {
          console.log(`No integration or token found for agent ${agentName}`);
          setError(`No API token found for agent "${agentName}". Please connect this agent first.`);
        }
      } catch (err) {
        console.error('Error loading integration details:', err);
        setError("Failed to load integration details. Please try again later.");
      } finally {
        setIntegrationLoading(false);
      }
    };
    
    loadIntegrationDetails();
  }, [agentName, user]);

  // Fetch connected lists for the current agent
  useEffect(() => {
    if (!agentName || !user?.id) return;

    const loadConnectedLists = async () => {
      try {
        setConnectedListsLoading(true);
        const connectedLists = await fetchConnectedLists(agentName);
        
        // Extract IDs from connected lists
        const connectedIds = connectedLists.map(list => list.id);
        console.log('Connected list IDs:', connectedIds);
        setConnectedListIds(connectedIds);
      } catch (err) {
        console.error('Error loading connected lists:', err);
      } finally {
        setConnectedListsLoading(false);
      }
    };

    loadConnectedLists();
  }, [agentName, user]);

  // Fetch lists when API credentials are loaded
  useEffect(() => {
    if (apiUrl && apiToken && !integrationLoading && !connectedListsLoading) {
      fetchLists();
    }
  }, [apiUrl, apiToken, integrationLoading, connectedListsLoading]);

  const fetchLists = async () => {
    if (!agentName || !apiUrl || !apiToken) {
      setError("API credentials not found. Please reconnect your ActiveCampaign account.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching lists for agent ${agentName} with URL ${apiUrl}`);
      const fetchedLists = await fetchEmailLists(apiUrl, apiToken);
      
      // Filter out already connected lists
      const filteredLists = fetchedLists.filter(list => !connectedListIds.includes(list.id || ''));
      
      if (filteredLists.length === 0) {
        if (fetchedLists.length === 0) {
          setError("No lists found in your ActiveCampaign account.");
        } else {
          setError("All available lists are already connected to this agent.");
        }
      } else {
        setLists(filteredLists);
        toast({
          title: "Lists fetched successfully",
          description: `Found ${filteredLists.length} available lists to connect.`,
        });
      }
    } catch (err: any) {
      console.error('Error fetching lists:', err);
      setError(err.message || "An error occurred while fetching lists");
      toast({
        title: "Error",
        description: err.message || "Failed to fetch lists from ActiveCampaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/agents/${agentName}/lists`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Lists
              </Button>
              <CardTitle>Available Lists for {agentName}</CardTitle>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchLists} 
              disabled={loading || integrationLoading || connectedListsLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
              Refresh Lists
            </Button>
          </div>
          <CardDescription>
            Connect lists to your agent by clicking the Connect button on each list
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {integrationLoading || connectedListsLoading ? (
            <LoadingState text="Loading integration details..." />
          ) : loading ? (
            <LoadingState />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              {error.includes("token") && (
                <Button onClick={() => navigate(`/agents`)}>
                  Connect Agent
                </Button>
              )}
              {!error.includes("token") && (
                <Button onClick={fetchLists}>Try Again</Button>
              )}
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No unconnected lists found. Click Refresh to fetch lists from ActiveCampaign.</p>
              <Button onClick={fetchLists}>Refresh Lists</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lists.map((list) => (
                <EmailListCard
                  key={list.id}
                  list={list}
                  agentName={agentName}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FetchListsPage;
