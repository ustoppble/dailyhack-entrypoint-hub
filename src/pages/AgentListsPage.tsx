import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { EmailList } from '@/lib/api/types';
import LoadingState from '@/components/lists/LoadingState';
import ErrorState from '@/components/lists/ErrorState';
import { fetchEmailLists, saveSelectedLists, fetchConnectedLists } from '@/lib/api/lists';
import { airtableIntegrationApi } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { List, ListCheck, Users, BookOpen, CheckCircle, ArrowLeft } from 'lucide-react';
import StatusMessage from '@/components/integration/StatusMessage';

const AgentListsPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [lists, setLists] = useState<EmailList[]>([]);
  const [selectedLists, setSelectedLists] = useState<EmailList[]>([]);
  const [connectedLists, setConnectedLists] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        
        // Fetch connected lists for this agent from Airtable
        const connectedListsData = await fetchConnectedLists(agentName);
        setConnectedLists(connectedListsData);
        
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

  const handleCheckboxChange = (list: EmailList) => {
    // Don't allow changes if list is already connected
    if (isListConnected(list.name)) {
      return;
    }
    
    setSelectedLists(prevSelected => {
      const isAlreadySelected = prevSelected.some(item => item.name === list.name);
      
      if (isAlreadySelected) {
        return prevSelected.filter(item => item.name !== list.name);
      } else {
        return [...prevSelected, list];
      }
    });
  };

  const handleImport = async () => {
    if (selectedLists.length === 0) {
      toast({
        title: "No lists selected",
        description: "Please select at least one list to import.",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      setSuccess(null);
      setError(null);
      
      if (!user) {
        throw new Error('You need to be logged in to perform this action');
      }
      
      // Pass the agentName to the saveSelectedLists function
      await saveSelectedLists(user.id, selectedLists, agentName);
      
      toast({
        title: "Lists imported successfully",
        description: `Imported ${selectedLists.length} list(s) for ${agentName}`,
      });
      
      // Update connected lists
      setConnectedLists(prev => [
        ...prev,
        ...selectedLists.map(list => list.name)
      ]);
      
      // Set success message
      setSuccess(`Successfully imported ${selectedLists.length} list(s) for ${agentName}`);
      
      // Clear selections after successful import
      setSelectedLists([]);
    } catch (error: any) {
      console.error('Error importing lists:', error);
      setError(error.message || "Failed to import selected lists");
      toast({
        title: "Import failed",
        description: error.message || "Failed to import selected lists",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  // Check if a list is already connected
  const isListConnected = (listName: string) => {
    return connectedLists.includes(listName);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error && !success) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/agents/${agentName}/central`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Central
            </Button>
            <h1 className="text-3xl font-bold">{agentName}</h1>
          </div>
          <Link to={`/agents/${agentName}/knowledge`}>
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" /> Knowledge Base
            </Button>
          </Link>
        </div>
        
        <StatusMessage error={error} success={success} />
        
        <Card className="shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-3xl font-bold">
              Lists
            </CardTitle>
            <p className="text-gray-500 mt-2">
              Select the lists you want to import
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {lists.length > 0 ? (
              <>
                <div className="space-y-4">
                  {lists.map((list) => {
                    const isConnected = isListConnected(list.name);
                    return (
                      <div 
                        key={list.name} 
                        className={`flex items-start space-x-4 p-4 border rounded-lg ${isConnected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                      >
                        <Checkbox 
                          id={`list-${list.name}`}
                          checked={isConnected ? true : selectedLists.some(item => item.name === list.name)}
                          onCheckedChange={() => handleCheckboxChange(list)}
                          className={`mt-1 ${isConnected ? 'opacity-60' : ''}`}
                          disabled={isConnected}
                        />
                        <div className="flex-1 ml-2">
                          <div className="flex items-center justify-between">
                            <label 
                              htmlFor={`list-${list.name}`} 
                              className={`font-medium cursor-pointer flex items-center ${isConnected ? 'text-gray-500' : ''}`}
                            >
                              <span className="text-lg">{list.name}</span>
                            </label>
                            {isConnected && (
                              <Badge variant="outline" className="flex items-center gap-1 ml-2 bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 border-green-300">
                                <CheckCircle className="h-3 w-3" /> Connected
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="inline-flex items-center mr-4">
                              <Users className="h-4 w-4 mr-1" /> 
                              {list.active_subscribers} subscribers
                            </span>
                          </div>
                          <p className="text-gray-500 mt-1 text-sm">
                            <strong>Description:</strong> {list.sender_reminder}
                          </p>
                          {list.insight && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                              <strong>Insight:</strong> {list.insight}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-8 flex justify-end">
                  <Button 
                    onClick={handleImport} 
                    disabled={selectedLists.length === 0 || importing}
                    className="px-8"
                  >
                    {importing ? 'Importing...' : 'Import Selected Lists'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <List className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">No lists found for this agent.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentListsPage;
