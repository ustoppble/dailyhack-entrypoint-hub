
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { fetchEmailById, EmailRecord } from '@/lib/api-service';
import LoadingState from '@/components/lists/LoadingState';

const EmailViewPage = () => {
  const { emailId } = useParams<{ emailId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<EmailRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmail = async () => {
      if (!emailId) return;

      setIsLoading(true);
      try {
        const fetchedEmail = await fetchEmailById(emailId);
        setEmail(fetchedEmail);
        
        if (!fetchedEmail) {
          setError('Email not found');
        }
      } catch (err: any) {
        setError('Failed to load email: ' + (err.message || 'Unknown error'));
        console.error('Error fetching email:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmail();
  }, [emailId]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return <Badge variant="default" className="bg-green-500">Sent</Badge>;
    }
    return <Badge variant="secondary">Scheduled</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        {isLoading ? (
          <LoadingState text="Loading email..." />
        ) : error ? (
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        ) : email ? (
          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-xl font-bold">{email.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p>{formatDate(email.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Campaign</p>
                    <p>{email.campaign_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email ID</p>
                    <p>{email.id_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p>{getStatusBadge(email.status)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-xl font-bold">Email Content</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-0">
                  <iframe
                    srcDoc={email.content}
                    className="w-full min-h-[500px] border-0"
                    title="Email Content"
                    sandbox="allow-same-origin"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 mb-4">Email not found</p>
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmailViewPage;
