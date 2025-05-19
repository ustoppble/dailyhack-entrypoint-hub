
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
        
        // Log emails with their date_set values
        console.log('Fetched emails with dates:', fetchedEmails.map(e => ({ 
          id: e.id,
          date: e.date, 
          date_set: e.date_set 
        })));
        
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

  const formatDate = (email: EmailRecord) => {
    // Try using date_set as our primary date source
    const dateString = email.date_set || email.date;
    
    // Debug the date string we're trying to format
    console.log(`Formatting date for email ${email.id}:`, dateString);
    
    // If the dateString is in ISO format (like "2025-05-20T20:06:00.000Z")
    // it should be directly parseable
    try {
      if (dateString && dateString !== 'No date available') {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return format(date, 'PPpp');
        }
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }
    
    return 'No date available';
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return <Badge variant="default" className="bg-green-500">Approved</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  const handleViewEmail = (emailId: string) => {
    navigate(`/email/${emailId}`);
  };

  const handleGoBack = () => {
    navigate(`/agents/${agentName}/email-planner`);
  };

  // Sort emails by date_set (newest to oldest)
  const sortedEmails = [...emails].sort((a, b) => {
    const dateA = a.date_set ? new Date(a.date_set).getTime() : 0;
    const dateB = b.date_set ? new Date(b.date_set).getTime() : 0;
    return dateB - dateA;
  });

  // Separate emails by status
  const approvedEmails = sortedEmails.filter(email => email.status === 1);
  const draftEmails = sortedEmails.filter(email => email.status !== 1);

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
              <div>
                {/* Draft Emails Section */}
                <div className="mb-6">
                  <h3 className="px-4 py-2 bg-gray-100 font-medium">Draft Emails</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draftEmails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No draft emails found
                          </TableCell>
                        </TableRow>
                      ) : (
                        draftEmails.map((email) => (
                          <TableRow key={email.id}>
                            <TableCell className="font-medium">
                              {formatDate(email)}
                            </TableCell>
                            <TableCell>{email.title}</TableCell>
                            <TableCell>{email.campaign_name}</TableCell>
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Approved Emails Section */}
                <div>
                  <h3 className="px-4 py-2 bg-gray-100 font-medium">Approved Emails</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedEmails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No approved emails found
                          </TableCell>
                        </TableRow>
                      ) : (
                        approvedEmails.map((email) => (
                          <TableRow key={email.id}>
                            <TableCell className="font-medium">
                              {formatDate(email)}
                            </TableCell>
                            <TableCell>{email.title}</TableCell>
                            <TableCell>{email.campaign_name}</TableCell>
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListEmailsPage;
