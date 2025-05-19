
import React, { useState } from 'react';
import { AutopilotRecord } from '@/lib/api/autopilot';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } from '@/lib/api/constants';

interface ManageAutopilotFormProps {
  autopilot: AutopilotRecord;
  lists: any[];
  campaignGoals: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

const ManageAutopilotForm: React.FC<ManageAutopilotFormProps> = ({ 
  autopilot, 
  onSuccess, 
  onCancel 
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { agentName } = useParams<{ agentName: string }>();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!autopilot.id || !agentName) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/autopilot/${autopilot.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable API error when deleting autopilot record:', errorData);
        throw new Error(`Airtable API error: ${response.status}`);
      }

      toast({
        title: "Autopilot deleted",
        description: "The autopilot has been successfully deleted.",
      });
      onSuccess();
      navigate(`/agents/${agentName}/planner`);
    } catch (error: any) {
      console.error("Error deleting autopilot:", error);
      toast({
        title: "Error deleting autopilot",
        description: error.message || "Failed to delete autopilot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center my-4">
        <p className="text-gray-500">
          Do you want to delete this autopilot campaign?
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            Delete Autopilot
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the autopilot
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Button variant="ghost" type="button" onClick={onCancel} className="w-full">
        Cancel
      </Button>
    </div>
  );
};

export default ManageAutopilotForm;
