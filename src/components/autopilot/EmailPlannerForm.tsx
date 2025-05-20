
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
  FormMessage, 
  FormDescription 
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Zap, Link, Loader2, AlertCircle } from 'lucide-react';
import { CampaignGoal } from '@/lib/api/goals';
import { checkExistingAutopilot } from '@/lib/api/lists';

interface ListItem {
  id: string;
  name: string;
  hasAutopilot?: boolean;
  list_id?: string;
}

// Form schema
const emailFormSchema = z.object({
  campaignGoalId: z.string({
    required_error: "Please select an offer",
  }),
  emailFrequency: z.enum(['once', 'twice'], {
    required_error: "Please select how many emails to produce per day",
  }),
  selectedLists: z.array(z.string()).min(1, {
    message: "Please select at least one list",
  }),
});

type EmailPlannerFormValues = z.infer<typeof emailFormSchema>;

interface EmailPlannerFormProps {
  campaignGoals: CampaignGoal[];
  lists: ListItem[];
  onSubmit: (values: EmailPlannerFormValues) => Promise<void>;
  isSubmitting: boolean;
  agentName: string;
}

const EmailPlannerForm: React.FC<EmailPlannerFormProps> = ({ 
  campaignGoals, 
  lists, 
  onSubmit, 
  isSubmitting,
  agentName 
}) => {
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | null>(null);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [emailFrequency, setEmailFrequency] = useState<string>('once');
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  
  const form = useForm<EmailPlannerFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      campaignGoalId: "",
      emailFrequency: "once",
      selectedLists: [],
    },
  });
  
  // Handle goal selection and update selected goal state
  const handleGoalSelection = (goalId: string) => {
    const goal = campaignGoals.find(g => g.id === goalId);
    setSelectedGoal(goal || null);
  };
  
  // Check if the selected lists already have an autopilot with the same schedule
  const validateSelectedLists = async () => {
    if (!selectedLists.length) return;
    
    setIsValidating(true);
    setButtonDisabled(true);
    setValidationMessage('');
    
    try {
      // Convert email frequency to cronId (1 for once, 2 for twice)
      const cronId = emailFrequency === 'once' ? 1 : 2;
      
      for (const listId of selectedLists) {
        // Skip lists that already have autopilot (as marked by the parent component)
        const list = lists.find(l => l.id === listId);
        if (!list || list.hasAutopilot) continue;
        
        // Use the list_id from the list object for checking
        const activeListId = list.list_id || listId;
        
        // Check if an autopilot already exists for this list and schedule
        const exists = await checkExistingAutopilot(activeListId, cronId, agentName);
        
        if (exists) {
          setValidationMessage(`An email autopilot already exists for "${list.name}" with the same schedule (${emailFrequency === 'once' ? '1 email per day' : '2 emails per day'}). Please choose a different list or schedule.`);
          setButtonDisabled(true);
          setIsValidating(false);
          return;
        }
      }
      
      // If we got here, all lists are valid
      setButtonDisabled(false);
      
    } catch (error) {
      console.error('Error validating selected lists:', error);
      setValidationMessage('An error occurred while validating selected lists');
      setButtonDisabled(false);
    } finally {
      setIsValidating(false);
    }
  };
  
  // When selected lists or email frequency changes, validate again
  useEffect(() => {
    // Track the current lists selection from form state
    const formSelectedLists = form.watch('selectedLists') || [];
    setSelectedLists(formSelectedLists);
    
    // Track the current email frequency from form state
    const formEmailFrequency = form.watch('emailFrequency') || 'once';
    setEmailFrequency(formEmailFrequency);
    
    // Only validate if we have selected lists
    if (formSelectedLists.length > 0) {
      validateSelectedLists();
    } else {
      setButtonDisabled(false);
      setValidationMessage('');
    }
  }, [form.watch('selectedLists'), form.watch('emailFrequency')]);
  
  return (
    <Card className="shadow-md mb-6">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-3xl font-bold">Email Autopilot</CardTitle>
        </div>
        <CardDescription>
          Activate automatic email production
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Alert className="mb-6">
          <AlertDescription>
            Activate the autopilot by selecting an offer and how many emails to automatically produce and send. Your agent will handle the content creation.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Offer Selection */}
            <FormField
              control={form.control}
              name="campaignGoalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleGoalSelection(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an offer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaignGoals.length > 0 ? (
                        campaignGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{goal.offer_name || goal.goal}</span>
                              <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 capitalize">
                                {goal.style}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No offers available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedGoal && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-700 mb-2">{selectedGoal.goal}</p>
                      {selectedGoal.link && (
                        <FormDescription className="flex items-center text-blue-600">
                          <Link className="h-4 w-4 mr-1" />
                          <a 
                            href={selectedGoal.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="underline hover:text-blue-800"
                          >
                            {selectedGoal.link}
                          </a>
                        </FormDescription>
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* List selection with multiple checkbox selection */}
            <FormField
              control={form.control}
              name="selectedLists"
              render={() => (
                <FormItem>
                  <FormLabel>Select Lists to Send To</FormLabel>
                  <div className="border rounded-md p-4 space-y-3">
                    {lists.length > 0 ? (
                      lists.map((list) => (
                        <FormField
                          key={list.id}
                          control={form.control}
                          name="selectedLists"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={list.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(list.id)}
                                    onCheckedChange={(checked) => {
                                      if (list.hasAutopilot) return; // Prevent checking if already has autopilot
                                      const updatedLists = checked
                                        ? [...field.value, list.id]
                                        : field.value?.filter(
                                            (value) => value !== list.id
                                          );
                                      field.onChange(updatedLists);
                                    }}
                                    disabled={list.hasAutopilot}
                                  />
                                </FormControl>
                                <div className="flex items-center gap-2">
                                  <FormLabel className={`font-normal ${list.hasAutopilot ? 'text-gray-400' : 'cursor-pointer'}`}>
                                    {list.name}
                                  </FormLabel>
                                  {list.hasAutopilot && (
                                    <div className="flex items-center text-sm text-amber-600">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      <span>Already in autopilot</span>
                                    </div>
                                  )}
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      ))
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-gray-500">No lists connected to this agent</p>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Radio button email frequency selection */}
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
            
            {/* Validation message for duplicate autopilots */}
            {validationMessage && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting || buttonDisabled || isValidating || !!validationMessage}
                className="px-8"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                ) : isValidating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validating...
                  </div>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" /> Activate Email Autopilot
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EmailPlannerForm;
