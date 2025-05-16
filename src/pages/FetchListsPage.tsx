
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, List } from 'lucide-react';
import { fetchEmailLists } from '@/lib/api/lists';
import { EmailList } from '@/lib/api/types';
import LoadingState from '@/components/lists/LoadingState';
import EmailListCard from '@/components/lists/EmailListCard';

const FetchListsPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState<EmailList[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch lists when the page loads
  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    if (!agentName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get API credentials from localStorage
      const apiUrl = localStorage.getItem('ac_api_url') || '';
      const apiToken = localStorage.getItem('ac_api_token') || '';
      
      if (!apiUrl || !apiToken) {
        setError("API credentials not found. Please reconnect your ActiveCampaign account.");
        setLoading(false);
        return;
      }
      
      // Fetch lists from the webhook
      const fetchedLists = await fetchEmailLists(apiUrl, apiToken);
      console.log('Fetched lists:', fetchedLists);
      
      if (fetchedLists.length === 0) {
        setError("No lists found in your ActiveCampaign account.");
      } else {
        setLists(fetchedLists);
        toast({
          title: "Lists fetched successfully",
          description: `Found ${fetchedLists.length} lists in your ActiveCampaign account.`,
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
              disabled={loading}
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
          {loading ? (
            <LoadingState />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchLists}>Try Again</Button>
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No lists found. Click Refresh to fetch lists from ActiveCampaign.</p>
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
