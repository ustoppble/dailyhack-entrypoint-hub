import React, { useState, useEffect } from 'react';
import { AutopilotRecord, CampaignGoal } from '@/lib/api-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_GOALS_TABLE_ID } from '@/lib/api/constants';

interface ManageAutopilotFormProps {
  autopilot: AutopilotRecord;
  lists: any[];
  campaignGoals: CampaignGoal[];
  onSuccess: () => void;
  onCancel: () => void;
}

const formSchema = z.object({
  listId: z.string().min(1, {
    message: "List ID is required.",
  }),
  campaignGoalId: z.string().min(1, {
    message: "Campaign Goal is required.",
  }),
  active: z.boolean().default(true),
})

const ManageAutopilotForm: React.FC<ManageAutopilotFormProps> = ({ autopilot, lists, campaignGoals, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { agentName } = useParams<{ agentName: string }>();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      listId: autopilot.listId.toString(),
      campaignGoalId: autopilot.campaignGoalId,
      active: autopilot.active,
    },
  })
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!agentName || !autopilot.id) return;
    
    try {
      // Prepare the data for updating the Airtable record
      const fields = {
        listId: parseInt(values.listId),
        campaignGoalId: values.campaignGoalId,
        active: values.active,
      };
      
      // Make the API call to update the Airtable record
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/autopilot/${autopilot.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable API error when updating autopilot record:', errorData);
        throw new Error(`Airtable API error: ${response.status}`);
      }
      
      toast({
        title: "Autopilot updated",
        description: "Your autopilot settings have been updated successfully.",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error updating autopilot:", error);
      toast({
        title: "Error updating autopilot",
        description: error.message || "Failed to update autopilot. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      navigate(`/agents/${agentName}/email-planner`);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="listId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>List</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id.toString()}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="campaignGoalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Goal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campaign goal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {campaignGoals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.offer_name || goal.goal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">Active</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Update Autopilot</Button>
        </div>
      </form>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full mt-4">
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
    </Form>
  );
};

export default ManageAutopilotForm;
