
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AutopilotRecord, updateAutopilotRecord, deleteAutopilotRecord } from '@/lib/api-service';
import { CampaignGoal } from '@/lib/api-service';

interface ListItem {
  id: string;
  name: string;
}

interface ManageAutopilotFormProps {
  autopilot: AutopilotRecord;
  lists: ListItem[];
  campaignGoals: CampaignGoal[];
  onSuccess: () => void;
  onCancel: () => void;
}

const manageFormSchema = z.object({
  listId: z.string({
    required_error: "Please select a list",
  }),
  campaignGoalId: z.string({
    required_error: "Please select a campaign goal",
  }),
  emailFrequency: z.enum(['once', 'twice'], {
    required_error: "Please select how many emails to produce per day",
  }),
});

type ManageFormValues = z.infer<typeof manageFormSchema>;

const ManageAutopilotForm = ({ 
  autopilot, 
  lists, 
  campaignGoals, 
  onSuccess, 
  onCancel 
}: ManageAutopilotFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | null>(null);

  const form = useForm<ManageFormValues>({
    resolver: zodResolver(manageFormSchema),
    defaultValues: {
      listId: String(autopilot.listId),
      campaignGoalId: autopilot.offerId || "",
      emailFrequency: autopilot.cronId === 1 ? "once" : "twice",
    },
  });

  // Handle goal selection and update selected goal state
  const handleGoalSelection = (goalId: string) => {
    const goal = campaignGoals.find(g => g.id === goalId);
    setSelectedGoal(goal || null);
  };

  // Load the initial selected goal if there's an offerId
  useEffect(() => {
    if (autopilot.offerId) {
      const goal = campaignGoals.find(g => g.id === autopilot.offerId);
      setSelectedGoal(goal || null);
    }
  }, [autopilot.offerId, campaignGoals]);

  const onSubmit = async (values: ManageFormValues) => {
    setIsSubmitting(true);
    try {
      const cronId = values.emailFrequency === "once" ? 1 : 2;
      
      const success = await updateAutopilotRecord(
        autopilot.id,
        values.listId,
        cronId,
        values.campaignGoalId
      );

      if (success) {
        toast({
          title: "Autopilot updated",
          description: "Your email autopilot has been updated successfully.",
        });
        onSuccess();
      } else {
        toast({
          title: "Update failed",
          description: "There was an error updating your autopilot.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating autopilot:', error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteAutopilotRecord(autopilot.id);
      
      if (success) {
        toast({
          title: "Autopilot deleted",
          description: "Your email autopilot has been deleted successfully.",
        });
        onSuccess();
      } else {
        toast({
          title: "Delete failed",
          description: "There was an error deleting your autopilot.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting autopilot:', error);
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Manage Autopilot</h3>
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Autopilot</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this autopilot? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* List Selection */}
          <FormField
            control={form.control}
            name="listId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email List</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a list" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campaign Goal Selection */}
          <FormField
            control={form.control}
            name="campaignGoalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Goal</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleGoalSelection(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign offer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {campaignGoals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{goal.offer_name || goal.objetivo}</span>
                          <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 capitalize">
                            {goal.style}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedGoal && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 mb-2">
                      {selectedGoal.description || selectedGoal.objetivo}
                    </p>
                    {selectedGoal.link && (
                      <p className="text-sm text-blue-600 flex items-center">
                        <a 
                          href={selectedGoal.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="underline hover:text-blue-800"
                        >
                          {selectedGoal.link}
                        </a>
                      </p>
                    )}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Frequency Selection */}
          <FormField
            control={form.control}
            name="emailFrequency"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Number of Emails per Day</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="once" id="once" />
                      </FormControl>
                      <FormLabel className="font-normal" htmlFor="once">
                        1 email per day (08h)
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="twice" id="twice" />
                      </FormControl>
                      <FormLabel className="font-normal" htmlFor="twice">
                        2 emails per day (08h and 20h)
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ManageAutopilotForm;
