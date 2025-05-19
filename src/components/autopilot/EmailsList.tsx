
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { fetchEmailsForList, EmailRecord } from '@/lib/api/autopilot';
import LoadingState from '@/components/lists/LoadingState';

interface EmailsListProps {
  listId: number;
  listName: string;
  onClose: () => void;
}

const EmailsList = ({ listId, listName, onClose }: EmailsListProps) => {
  const navigate = useNavigate();
  const { agentName } = useParams<{ agentName: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmails = async () => {
      if (!agentName) {
        setError('Agent name not found');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Pass both listId and agentName to filter emails correctly
        const fetchedEmails = await fetchEmailsForList(listId, agentName);
        setEmails(fetchedEmails);
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

  return (
    <Card className="w-full">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-xl flex items-center justify-between">
          <div>Emails for list: {listName}</div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
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
              onClick={onClose} 
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
  );
};

export default EmailsList;
