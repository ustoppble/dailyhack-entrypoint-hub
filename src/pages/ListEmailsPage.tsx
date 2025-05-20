
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
import { ArrowLeft, Search, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fetchEmailsForList, EmailRecord, getAutopilotIdForList } from '@/lib/api/autopilot';
import LoadingState from '@/components/lists/LoadingState';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

const ListEmailsPage = () => {
  const navigate = useNavigate();
  // Updated to match the route params from App.tsx
  const { agentName, listId } = useParams<{ agentName: string, listId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [listName, setListName] = useState<string>('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autopilotId, setAutopilotId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadEmails();
  }, [listId, agentName]);

  const loadEmails = async () => {
    if (!agentName || !listId) {
      setError('Agent name or list ID not found');
      setIsLoading(false);
      return;
    }
    
    console.log(`Loading emails for agent: ${agentName} and list ID: ${listId}`);
    setIsLoading(true);
    try {
      // Parse listId as a number since fetchEmailsForList expects a number
      const parsedListId = parseInt(listId, 10);
      if (isNaN(parsedListId)) {
        throw new Error(`Invalid list ID: ${listId}`);
      }
      
      // Get the autopilot ID for this list to display in UI
      const autopilotRecordId = await getAutopilotIdForList(parsedListId);
      if (autopilotRecordId) {
        setAutopilotId(autopilotRecordId);
      }
      
      // Fetch emails for the specified list, now filtered by autopilot ID
      const fetchedEmails = await fetchEmailsForList(parsedListId, agentName);
      
      console.log('Fetched emails with dates and status:', fetchedEmails.map(e => ({ 
        id: e.id,
        date: e.date_set,
        status: e.status,
        autopilotId: e.id_autopilot
      })));
      
      setEmails(fetchedEmails);
      
      // Set list name based on the list ID since list_name might not exist on EmailRecord
      setListName(`List #${listId}`);
      
      // Clear selected emails when loading new emails
      setSelectedEmails([]);
    } catch (err: any) {
      setError('Failed to load emails: ' + (err.message || 'Unknown error'));
      console.error('Error fetching emails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (email: EmailRecord) => {
    // Try using date_set as our primary date source
    const dateString = email.date_set || email.date;
    
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

  const getStatusBadge = (status: number | string) => {
    // Convert status to number if it's a string
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    
    if (statusNum === 1) {
      return <Badge variant="default" className="bg-green-500">Approved</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  const handleViewEmail = (emailId: string) => {
    if (agentName) {
      navigate(`/agents/${agentName}/email/${emailId}`);
    } else {
      navigate(`/email/${emailId}`);
    }
  };

  const handleGoBack = () => {
    // Updated to navigate back to the email planner
    navigate(`/agents/${agentName}/planner`);
  };

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev => {
      if (prev.includes(emailId)) {
        return prev.filter(id => id !== emailId);
      } else {
        return [...prev, emailId];
      }
    });
  };

  const handleSelectAll = () => {
    if (draftEmails.length === selectedEmails.length) {
      // If all emails are selected, unselect all
      setSelectedEmails([]);
    } else {
      // Otherwise, select all draft emails
      setSelectedEmails(draftEmails.map(email => email.id));
    }
  };

  const handleApproveSelected = async () => {
    if (selectedEmails.length === 0) {
      toast({
        title: "No emails selected",
        description: "Please select at least one email to approve.",
        variant: "destructive"
      });
      return;
    }

    if (!user || !user.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to approve emails.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    // The webhook URL for email approval
    const webhookUrl = 'https://primary-production-2e546.up.railway.app/webhook/mailapprove';

    // Process each selected email
    for (const emailId of selectedEmails) {
      try {
        // Find the email record to include its data in the payload
        const emailRecord = emails.find(email => email.id === emailId);
        
        if (!emailRecord) {
          console.error(`Email with ID ${emailId} not found in the current list`);
          failCount++;
          continue;
        }
        
        // Prepare the payload for the webhook
        const payload = {
          activehosted: agentName,
          userId: user.id,
          emailId: emailId,
          id_email: emailRecord.id_email // Use the actual id_email from the email record
        };

        console.log('Sending approval request to webhook:', payload);
        
        // Send the POST request to the webhook
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Webhook error:', errorData);
          throw new Error(`Webhook error: ${response.status}`);
        }

        successCount++;
      } catch (error) {
        console.error(`Error approving email ${emailId}:`, error);
        failCount++;
      }
    }

    // Show success message and reload emails
    if (successCount > 0) {
      toast({
        title: `${successCount} email(s) approved successfully`,
        description: failCount > 0 ? `${failCount} email(s) failed to approve.` : "",
        variant: successCount > 0 ? "default" : "destructive"
      });
      
      // Reload emails to update the UI
      await loadEmails();
    } else {
      toast({
        title: "Failed to approve emails",
        description: "Please try again later.",
        variant: "destructive"
      });
    }

    setIsProcessing(false);
    setSelectedEmails([]);
  };

  // Sort emails by date_set (newest to oldest)
  const sortedEmails = [...emails].sort((a, b) => {
    const dateA = a.date_set ? new Date(a.date_set).getTime() : 0;
    const dateB = b.date_set ? new Date(b.date_set).getTime() : 0;
    return dateB - dateA;
  });

  // Separate emails by status
  // Convert status to number if it's a string before comparison
  const approvedEmails = sortedEmails.filter(email => {
    const status = typeof email.status === 'string' ? parseInt(email.status) : email.status;
    return status === 1;
  });
  
  const draftEmails = sortedEmails.filter(email => {
    const status = typeof email.status === 'string' ? parseInt(email.status) : email.status;
    return status !== 1;
  });

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
              {autopilotId && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Autopilot ID: {autopilotId}
                </Badge>
              )}
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
                  
                  {draftEmails.length > 0 && (
                    <div className="p-4 border-b flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="select-all" 
                          checked={draftEmails.length > 0 && selectedEmails.length === draftEmails.length}
                          onCheckedChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">
                          Select All ({draftEmails.length})
                        </label>
                      </div>
                      <Button
                        variant="default"
                        onClick={handleApproveSelected}
                        disabled={selectedEmails.length === 0 || isProcessing}
                        className="flex items-center gap-2"
                      >
                        <CheckSquare className="h-4 w-4" />
                        Approve Selected ({selectedEmails.length})
                      </Button>
                    </div>
                  )}
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
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
                          <TableCell colSpan={6} className="text-center py-4">
                            No draft emails found
                          </TableCell>
                        </TableRow>
                      ) : (
                        draftEmails.map((email) => (
                          <TableRow key={email.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedEmails.includes(email.id)}
                                onCheckedChange={() => handleSelectEmail(email.id)}
                              />
                            </TableCell>
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
