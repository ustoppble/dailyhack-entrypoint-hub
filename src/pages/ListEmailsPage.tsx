
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fetchEmailsForList, EmailRecord } from '@/lib/api/autopilot';
import LoadingState from '@/components/lists/LoadingState';

const ListEmailsPage = () => {
  const navigate = useNavigate();
  const { agentName, listId } = useParams<{ agentName: string, listId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [listName, setListName] = useState<string>('');

  useEffect(() => {
    const loadEmails = async () => {
      if (!agentName || !listId) {
        setError('Agent name or list ID not found');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Fetch emails for the specified list
        const fetchedEmails = await fetchEmailsForList(Number(listId), agentName);
        setEmails(fetchedEmails);
        
        // Set list name based on the list ID since list_name might not exist on EmailRecord
        setListName(`List #${listId}`);
      } catch (err: any) {
        setError('Failed to load emails: ' + (err.message || 'Unknown error'));
        console.error('Error fetching emails:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmails();
  }, [listId, agentName]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPpp'); // Format: "Apr 29, 2021, 1:30 PM"
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

  const handleViewEmail = (emailId: string) => {
    navigate(`/email/${emailId}`);
  };

  const handleGoBack = () => {
    navigate(`/agents/${agentName}/email-planner`);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Email Planner
          </Button>
        </div>
        
        <Card className="w-full">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl">
              Emails for list: {listName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20">
                <LoadingState text="Loading emails..." />
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={handleGoBack} 
                  className="mt-4"
                >
                  Go Back
                </Button>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No emails found for this list.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium">
                        {formatDate(email.date)}
                      </TableCell>
                      <TableCell>{email.title}</TableCell>
                      <TableCell>{email.campaign_name}</TableCell>
                      <TableCell>{email.id_email}</TableCell>
                      <TableCell>{getStatusBadge(email.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewEmail(email.id)}
                          className="flex items-center gap-1"
                        >
                          <Search className="h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListEmailsPage;
