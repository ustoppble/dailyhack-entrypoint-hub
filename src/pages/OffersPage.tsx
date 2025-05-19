
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingState from '@/components/lists/LoadingState';
import StatusMessage from '@/components/integration/StatusMessage';
import { fetchCampaignGoals, CampaignGoal } from '@/lib/api/goals';
import OfferForm from '@/components/offers/OfferForm';
import OffersList from '@/components/offers/OffersList';
import PageHeader from '@/components/autopilot/PageHeader';

const OffersPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<CampaignGoal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadOffers = async () => {
    if (!agentName || !user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Pass user ID to filter offers
      const campaignGoals = await fetchCampaignGoals(agentName, user.id.toString());
      setOffers(campaignGoals);
    } catch (err) {
      console.error('Failed to load offers:', err);
      setError('Failed to load offers. Please try again later.');
      toast({
        title: "Error",
        description: "Could not load campaign goals",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadOffers();
  }, [agentName, user?.id]);
  
  const handleSuccess = (message: string) => {
    setSuccess(message);
    toast({
      title: "Success",
      description: message,
    });
    loadOffers();
  };
  
  const handleError = (message: string) => {
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };
  
  const handleDeleteOffer = (offerId: string) => {
    // Remove from local state
    setOffers(prevOffers => prevOffers.filter(offer => offer.id !== offerId));
    toast({
      title: "Success",
      description: "Offer deleted successfully",
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">Please login to manage campaign goals.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {agentName && <PageHeader agentName={agentName} />}

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Campaign Goals</h1>
          <p className="text-gray-500">
            Create and manage your campaign goals for this agent
          </p>
        </div>

        <StatusMessage error={error} success={success} />

        {/* Campaign Goals List Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Campaign Goals</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadOffers}
            >
              Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <LoadingState text="Loading campaign goals..." />
          ) : (
            <OffersList 
              offers={offers}
              onDelete={handleDeleteOffer}
              onRefresh={loadOffers}
            />
          )}
        </div>
        
        {/* Create New Campaign Goal Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign Goal</CardTitle>
            <CardDescription>
              Fill out the form below to create a new campaign goal for your email automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OfferForm 
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OffersPage;
