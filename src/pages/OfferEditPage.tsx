
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import StatusMessage from '@/components/integration/StatusMessage';
import LoadingState from '@/components/lists/LoadingState';
import OfferForm from '@/components/offers/OfferForm';
import PageHeader from '@/components/autopilot/PageHeader';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_GOALS_TABLE_ID } from '@/lib/api/constants';

interface OfferData {
  offer_name: string;
  goal: string;
  link: string;
  style: 'softsell' | 'hardsell' | 'nutring' | 'event';
}

const OfferEditPage = () => {
  const { agentName, offerId } = useParams<{ agentName: string; offerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferData = async () => {
      if (!agentName || !offerId || !user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_GOALS_TABLE_ID}/${offerId}`,
          {
            headers: {
              'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch offer: ${response.status}`);
        }

        const data = await response.json();
        
        // Verify that this offer belongs to the current user
        // Convert both to numbers for proper comparison
        const recordUserId = Number(data.fields.id_user);
        const currentUserId = Number(user.id);

        if (data.fields.id_user && recordUserId !== currentUserId) {
          throw new Error('You do not have permission to edit this offer');
        }
        
        // Extract relevant fields for the form
        setOfferData({
          offer_name: data.fields.offer_name || '',
          goal: data.fields.goal || '',
          link: data.fields.link || '',
          style: data.fields.style || 'nutring',
        });
      } catch (err) {
        console.error('Failed to load offer data:', err);
        setError('Failed to load offer. Please try again later.');
        toast({
          title: "Error",
          description: "Could not load campaign goal data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOfferData();
  }, [agentName, offerId, user?.id]);
  
  const handleSuccess = (message: string) => {
    setSuccess(message);
    toast({
      title: "Success",
      description: message,
    });
    
    // Navigate back to offers list after a short delay
    setTimeout(() => {
      navigate(`/agents/${agentName}/offers`);
    }, 1500);
  };
  
  const handleError = (message: string) => {
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">Please login to edit campaign goals.</p>
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
        
        <Button
          variant="ghost"
          className="mb-6 pl-0 flex items-center"
          onClick={() => navigate(`/agents/${agentName}/offers`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaign Goals
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Campaign Goal</h1>
          <p className="text-gray-500">
            Update your campaign goal details
          </p>
        </div>

        <StatusMessage error={error} success={success} />

        {isLoading ? (
          <LoadingState text="Loading campaign goal data..." />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Edit Campaign Goal</CardTitle>
              <CardDescription>
                Update the information for this campaign goal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offerData ? (
                <OfferForm 
                  onSuccess={handleSuccess}
                  onError={handleError}
                  initialData={offerData}
                  isEditing={true}
                  offerId={offerId}
                />
              ) : (
                <div className="py-4 text-center text-red-500">
                  Failed to load offer data. Please try again.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OfferEditPage;
