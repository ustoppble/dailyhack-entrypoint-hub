
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Tag, FileText, CheckCircle, Clock } from 'lucide-react';
import { fetchEmailById, EmailRecord } from '@/lib/api/autopilot';
import LoadingState from '@/components/lists/LoadingState';

const EmailViewPage = () => {
  const { emailId } = useParams<{ emailId: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<EmailRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmail = async () => {
      if (!emailId) {
        setError('Email ID not found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const emailData = await fetchEmailById(emailId);
        
        if (!emailData) {
          setError('Email not found');
          return;
        }
        
        setEmail(emailData);
      } catch (err: any) {
        console.error('Error loading email:', err);
        setError(err.message || 'Failed to load email');
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

  const getStatusBadge = (status: number | string) => {
    // Convert status to number if it's a string
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    
    if (statusNum === 1) {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Sent
          </Badge>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-500" />
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
          Scheduled
        </Badge>
      </div>
    );
  };

  const goBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goBack}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <LoadingState text="Loading email..." />
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goBack}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error || 'Email not found'}</p>
                <Button variant="default" onClick={goBack}>Go Back</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goBack}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        {isLoading ? (
          <LoadingState text="Loading email..." />
        ) : error || !email ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error || 'Email not found'}</p>
                <Button variant="default" onClick={goBack}>Go Back</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl">{email.title}</CardTitle>
              <CardDescription>
                <div className="flex flex-col space-y-2 mt-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{formatDate(email.date_set || email.date)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Tag className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Campaign: {email.campaign_name}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FileText className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Email ID: {email.id_email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="mr-2">Status:</span>
                    {getStatusBadge(email.status)}
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="border rounded-md overflow-hidden bg-white">
                <div className="p-4 h-[600px] overflow-auto">
                  {email.content ? (
                    <iframe
                      title="Email Content"
                      srcDoc={email.content}
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No content available for this email
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmailViewPage;
