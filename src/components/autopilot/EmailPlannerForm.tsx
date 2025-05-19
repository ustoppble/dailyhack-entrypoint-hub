
import React from 'react';
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

interface ListItem {
  id: string;
  name: string;
  hasAutopilot?: boolean;
}

// Form schema
const emailFormSchema = z.object({
  campaignGoalId: z.string({
    required_error: "Please select a campaign goal",
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
}

const EmailPlannerForm: React.FC<EmailPlannerFormProps> = ({ 
  campaignGoals, 
  lists, 
  onSubmit, 
  isSubmitting 
}) => {
  const [selectedGoal, setSelectedGoal] = React.useState<CampaignGoal | null>(null);
  
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
            Activate the autopilot by selecting a campaign goal and how many emails to automatically produce and send. Your agent will handle the content creation.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a campaign offer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaignGoals.length > 0 ? (
                        campaignGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{goal.offer_name || goal.objetivo}</span>
                              <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 capitalize">
                                {goal.style}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No goals available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedGoal && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-700 mb-2">{selectedGoal.description || selectedGoal.objetivo}</p>
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
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
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
