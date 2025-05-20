
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Search, CheckSquare, X, Trash2, Calendar, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fetchEmailsForList, EmailRecord, getAutopilotIdForList } from '@/lib/api/autopilot';
import LoadingState from '@/components/lists/LoadingState';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { airtableTasksApi, airtableUpdatesApi, airtableAutopilotTasksApi } from '@/lib/api/client';

// Define types for our new data
interface Task {
  id: string;
  fields: {
    list_id?: string | number;
    first_email_date?: string;
    last_email_date?: string;
    email_count?: number;
    name?: string;
    description?: string;
    status?: string;
    id_autopilot?: number;
  };
  emailCount?: number; // New property to store the actual email count from query
}

interface Update {
  id: string;
  fields: {
    next_update?: string;
  };
}

const ListEmailsPage = () => {
  const navigate = useNavigate();
  const { agentName, listId } = useParams<{ agentName: string, listId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [listName, setListName] = useState<string>('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectedApprovedEmails, setSelectedApprovedEmails] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autopilotId, setAutopilotId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // New state for task and update information
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nextUpdate, setNextUpdate] = useState<string | null>(null);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  useEffect(() => {
    loadEmails();
    loadNextUpdate();
  }, [listId, agentName]);

  useEffect(() => {
    // Only load tasks when autopilotId is available
    if (autopilotId) {
      loadTasks(autopilotId);
    }
  }, [autopilotId]);

  const loadTasks = async (autopilotId: string) => {
    if (!listId || !autopilotId) return;
    
    setIsTasksLoading(true);
    try {
      // Fetch tasks related to this autopilot from the new table
      const response = await airtableAutopilotTasksApi.get('', {
        params: {
          filterByFormula: `{id_autopilot}='${autopilotId}'`
        }
      });
      
      console.log('Autopilot Tasks data:', response.data);
      
      // Get tasks without email counts first
      const fetchedTasks: Task[] = response.data.records || [];
      
      // For each task, we'll get its email count by querying the emails table
      const tasksWithCounts = await Promise.all(fetchedTasks.map(async (task) => {
        // Get the id_autopilot_task value from the task
        const taskId = task.id;
        
        try {
          // Query the emails table to count emails associated with this task
          const emailsResponse = await airtableTasksApi.get('', {
            params: {
              filterByFormula: `{id_autopilot_task}='${task.fields.id_autopilot}'`
            }
          });
          
          console.log(`Emails for task ${task.fields.id_autopilot}:`, emailsResponse.data);
          
          // Count the emails
          const emailCount = emailsResponse.data.records ? emailsResponse.data.records.length : 0;
          
          // Return the task with the email count
          return {
            ...task,
            emailCount
          };
        } catch (err) {
          console.error(`Error fetching emails for task ${taskId}:`, err);
          return {
            ...task,
            emailCount: 0
          };
        }
      }));
      
      setTasks(tasksWithCounts);
    } catch (err: any) {
      console.error('Error fetching autopilot tasks:', err);
      setTasksError('Failed to load tasks information');
    } finally {
      setIsTasksLoading(false);
    }
  };

  const loadNextUpdate = async () => {
    try {
      // Fetch next update information
      const response = await airtableUpdatesApi.get('');
      console.log('Updates data:', response.data);
      
      // Get the first record since we only need one next_update value
      const updateRecord = response.data.records && response.data.records[0];
      if (updateRecord && updateRecord.fields && updateRecord.fields.next_update) {
        setNextUpdate(updateRecord.fields.next_update);
      }
    } catch (err) {
      console.error('Error fetching next update:', err);
    }
  };

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
      if (autopilotRecordId !== null) {
        // Convert to string before setting to state
        setAutopilotId(String(autopilotRecordId));
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

  // Format a date string nicely or return placeholder
  const formatTaskDate = (dateStr?: string) => {
    if (!dateStr) return 'Not scheduled';
    
    try {
      const date = parseISO(dateStr);
      return format(date, 'PPP');
    } catch (e) {
      console.error('Error parsing date:', e);
      return 'Invalid date';
    }
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

  const handleSelectApprovedEmail = (emailId: string) => {
    setSelectedApprovedEmails(prev => {
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

  const handleSelectAllFutureApproved = () => {
    const now = new Date();
    const futureApprovedEmails = approvedEmails.filter(email => {
      // Check if the email has a future send date
      const emailDate = email.date_set ? new Date(email.date_set) : new Date(email.date || "");
      return !isNaN(emailDate.getTime()) && emailDate > now;
    });
    
    if (futureApprovedEmails.length === selectedApprovedEmails.length) {
      // If all future emails are selected, unselect all
      setSelectedApprovedEmails([]);
    } else {
      // Otherwise, select all future approved emails
      setSelectedApprovedEmails(futureApprovedEmails.map(email => email.id));
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
    let allPromises = [];

    // The webhook URL for email approval
    const webhookUrl = 'https://primary-production-2e546.up.railway.app/webhook/mailapprove';

    // Create an array of promises for each email approval
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
        
        // Create a promise for each webhook request and add to our array
        const requestPromise = fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }).then(response => {
          if (!response.ok) {
            return response.json().catch(() => ({})).then(errorData => {
              console.error('Webhook error:', errorData);
              throw new Error(`Webhook error: ${response.status}`);
            });
          }
          successCount++;
          return response.json();
        }).catch(error => {
          console.error(`Error approving email ${emailId}:`, error);
          failCount++;
          throw error;
        });
        
        allPromises.push(requestPromise);
      } catch (error) {
        console.error(`Error creating request for email ${emailId}:`, error);
        failCount++;
      }
    }

    try {
      // Wait for all webhook requests to complete
      await Promise.allSettled(allPromises);
      
      // Show success message
      if (successCount > 0) {
        toast({
          title: `${successCount} email(s) approved successfully`,
          description: failCount > 0 ? `${failCount} email(s) failed to approve.` : "",
          variant: successCount > 0 ? "default" : "destructive"
        });
        
        // Only reload emails AFTER all webhook responses have been received
        await loadEmails();
      } else {
        toast({
          title: "Failed to approve emails",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in Promise.allSettled:", error);
      toast({
        title: "Error processing approvals",
        description: "Some emails may not have been approved correctly.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setSelectedEmails([]);
    }
  };

  const handleRevertToDraft = async () => {
    if (selectedApprovedEmails.length === 0) {
      toast({
        title: "No emails selected",
        description: "Please select at least one approved email to revert to draft.",
        variant: "destructive"
      });
      return;
    }

    if (!user || !user.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to revert emails.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;
    let allPromises = [];

    // The webhook URL for reverting to draft
    const webhookUrl = 'https://primary-production-2e546.up.railway.app/webhook/mail-draft';

    // Create an array of promises for each email revert operation
    for (const emailId of selectedApprovedEmails) {
      try {
        // Find the email record to include its data in the payload
        const emailRecord = emails.find(email => email.id === emailId);
        
        if (!emailRecord) {
          console.error(`Email with ID ${emailId} not found in the current list`);
          failCount++;
          continue;
        }

        // Check if the email send date is in the future
        const emailDate = emailRecord.date_set ? new Date(emailRecord.date_set) : new Date(emailRecord.date || "");
        const now = new Date();
        
        if (isNaN(emailDate.getTime()) || emailDate <= now) {
          console.error(`Email with ID ${emailId} cannot be reverted because its send date is not in the future`);
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

        console.log('Sending revert to draft request to webhook:', payload);
        
        // Create a promise for each webhook request and add to our array
        const requestPromise = fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }).then(response => {
          if (!response.ok) {
            return response.json().catch(() => ({})).then(errorData => {
              console.error('Webhook error:', errorData);
              throw new Error(`Webhook error: ${response.status}`);
            });
          }
          successCount++;
          return response.json();
        }).catch(error => {
          console.error(`Error reverting email ${emailId}:`, error);
          failCount++;
          throw error;
        });
        
        allPromises.push(requestPromise);
      } catch (error) {
        console.error(`Error creating request for email ${emailId}:`, error);
        failCount++;
      }
    }

    try {
      // Wait for all webhook requests to complete
      await Promise.allSettled(allPromises);
      
      // Show success message
      if (successCount > 0) {
        toast({
          title: `${successCount} email(s) reverted to draft successfully`,
          description: failCount > 0 ? `${failCount} email(s) failed to revert.` : "",
          variant: successCount > 0 ? "default" : "destructive"
        });
        
        // Only reload emails AFTER all webhook responses have been received
        await loadEmails();
      } else {
        toast({
          title: "Failed to revert emails",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in Promise.allSettled:", error);
      toast({
        title: "Error processing revert requests",
        description: "Some emails may not have been reverted correctly.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setSelectedApprovedEmails([]);
    }
  };

  // New handler for deleting selected draft emails
  const handleDeleteSelected = async () => {
    if (selectedEmails.length === 0) {
      toast({
        title: "No emails selected",
        description: "Please select at least one email to delete.",
        variant: "destructive"
      });
      return;
    }

    if (!user || !user.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to delete emails.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;
    let allPromises = [];

    // The webhook URL for email deletion
    const webhookUrl = 'https://primary-production-2e546.up.railway.app/webhook/mail-delete';

    // Create an array of promises for each email deletion
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

        console.log('Sending delete request to webhook:', payload);
        
        // Create a promise for each webhook request and add to our array
        const requestPromise = fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }).then(response => {
          if (!response.ok) {
            return response.json().catch(() => ({})).then(errorData => {
              console.error('Webhook error:', errorData);
              throw new Error(`Webhook error: ${response.status}`);
            });
          }
          successCount++;
          return response.json();
        }).catch(error => {
          console.error(`Error deleting email ${emailId}:`, error);
          failCount++;
          throw error;
        });
        
        allPromises.push(requestPromise);
      } catch (error) {
        console.error(`Error creating delete request for email ${emailId}:`, error);
        failCount++;
      }
    }

    try {
      // Wait for all webhook requests to complete
      await Promise.allSettled(allPromises);
      
      // Show success message
      if (successCount > 0) {
        toast({
          title: `${successCount} email(s) deleted successfully`,
          description: failCount > 0 ? `${failCount} email(s) failed to delete.` : "",
          variant: successCount > 0 ? "default" : "destructive"
        });
        
        // Only reload emails AFTER all webhook responses have been received
        await loadEmails();
      } else {
        toast({
          title: "Failed to delete emails",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in Promise.allSettled:", error);
      toast({
        title: "Error processing deletions",
        description: "Some emails may not have been deleted correctly.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setSelectedEmails([]);
    }
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

  // Filter future approved emails
  const futureApprovedEmails = approvedEmails.filter(email => {
    const emailDate = email.date_set ? new Date(email.date_set) : new Date(email.date || "");
    const now = new Date();
    return !isNaN(emailDate.getTime()) && emailDate > now;
  });

  // Check if an email can be reverted (send date is in the future)
  const canRevertEmail = (email: EmailRecord) => {
    const emailDate = email.date_set ? new Date(email.date_set) : new Date(email.date || "");
    const now = new Date();
    return !isNaN(emailDate.getTime()) && emailDate > now;
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

        {/* Next Update Information */}
        {nextUpdate && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-amber-600">
                <Calendar className="h-5 w-5" />
                <p className="font-medium">
                  Next scheduled update: {formatTaskDate(nextUpdate)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Tasks Information */}
        <Card className="mb-6">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl">Tasks for List {listId}</CardTitle>
            <CardDescription>
              Email creation tasks associated with this list
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isTasksLoading ? (
              <div className="p-6 flex justify-center">
                <LoadingState text="Loading tasks..." />
              </div>
            ) : tasksError ? (
              <div className="p-6 text-center text-red-500">{tasksError}</div>
            ) : tasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No tasks found for this list.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>First Email</TableHead>
                    <TableHead>Last Email</TableHead>
                    <TableHead>Emails</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.fields.name || 'Unnamed Task'}</TableCell>
                      <TableCell>{task.fields.description || 'No description'}</TableCell>
                      <TableCell>{formatTaskDate(task.fields.first_email_date)}</TableCell>
                      <TableCell>{formatTaskDate(task.fields.last_email_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span>{task.emailCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={task.fields.status === 'completed' ? 'default' : 'secondary'}>
                          {task.fields.status || 'pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Emails List Card */}
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
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          onClick={handleApproveSelected}
                          disabled={selectedEmails.length === 0 || isProcessing}
                          className="flex items-center gap-2"
                        >
                          <CheckSquare className="h-4 w-4" />
                          Approve Selected ({selectedEmails.length})
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={handleDeleteSelected}
                          disabled={selectedEmails.length === 0 || isProcessing}
                          className="flex items-center gap-2 border-red-500 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Selected ({selectedEmails.length})
                        </Button>
                      </div>
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
                  
                  {futureApprovedEmails.length > 0 && (
                    <div className="p-4 border-b flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="select-all-approved" 
                          checked={futureApprovedEmails.length > 0 && selectedApprovedEmails.length === futureApprovedEmails.length}
                          onCheckedChange={handleSelectAllFutureApproved}
                        />
                        <label htmlFor="select-all-approved" className="text-sm font-medium">
                          Select All Future Emails ({futureApprovedEmails.length})
                        </label>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleRevertToDraft}
                        disabled={selectedApprovedEmails.length === 0 || isProcessing}
                        className="flex items-center gap-2 border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                        Revert to Draft ({selectedApprovedEmails.length})
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
                      {approvedEmails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No approved emails found
                          </TableCell>
                        </TableRow>
                      ) : (
                        approvedEmails.map((email) => {
                          const canRevert = canRevertEmail(email);
                          return (
                            <TableRow key={email.id}>
                              <TableCell>
                                {canRevert && (
                                  <Checkbox 
                                    checked={selectedApprovedEmails.includes(email.id)}
                                    onCheckedChange={() => handleSelectApprovedEmail(email.id)}
                                  />
                                )}
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
                          );
                        })
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
