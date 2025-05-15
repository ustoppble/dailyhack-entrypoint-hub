
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import IntegrationCard from '@/components/integration/IntegrationCard';
import { fetchUserIntegrations } from '@/lib/api/integration';

const ListsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<{id: string, api: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadIntegrations = async () => {
      if (!user) {
        navigate('/integrate');
        return;
      }
      
      try {
        const userIntegrations = await fetchUserIntegrations(user.id);
        setIntegrations(userIntegrations);
      } catch (error: any) {
        console.error('Error loading integrations:', error);
        setError(error.message || 'Failed to load ActiveCampaign accounts');
        toast({
          title: 'Error loading accounts',
          description: error.message || 'Could not load your ActiveCampaign accounts.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadIntegrations();
  }, [user, navigate, toast]);
  
  const handleAddNewIntegration = () => {
    navigate('/integrate');
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Your ActiveCampaign Accounts</CardTitle>
            <CardDescription className="text-center">
              Select an account to work with or add a new integration
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-600">Loading your ActiveCampaign accounts...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => navigate('/integrate')}
                >
                  Back to Integration
                </Button>
              </div>
            ) : (
              <>
                {integrations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No ActiveCampaign accounts found.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please add an integration to get started.
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={handleAddNewIntegration}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Integration
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {integrations.map((integration) => (
                        <IntegrationCard
                          key={integration.id}
                          id={integration.id}
                          name={integration.api}
                        />
                      ))}
                      <Card className="flex flex-col items-center justify-center border-dashed h-full min-h-[240px]">
                        <Button
                          variant="outline"
                          size="lg"
                          className="gap-2"
                          onClick={handleAddNewIntegration}
                        >
                          <Plus className="h-4 w-4" />
                          Add New Account
                        </Button>
                      </Card>
                    </div>
                    
                    <Separator className="my-8" />
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListsPage;
