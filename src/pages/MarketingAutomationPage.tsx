
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import step components
import ImportListsStep from '@/components/marketing/ImportListsStep';
import CreatePersonasStep from '@/components/marketing/CreatePersonasStep';
import ImportContentsStep from '@/components/marketing/ImportContentsStep';
import GenerateEmailsStep from '@/components/marketing/GenerateEmailsStep';

// Define step types
type StepId = 'import-lists' | 'create-personas' | 'import-contents' | 'generate-emails';

const MarketingAutomationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<StepId>('import-lists');
  const [completedSteps, setCompletedSteps] = useState<StepId[]>([]);
  const [importedLists, setImportedLists] = useState<any[]>([]);
  const [createdPersonas, setCreatedPersonas] = useState<any[]>([]);
  const [importedContent, setImportedContent] = useState<any | null>(null);

  // Handle step completion
  const handleStepComplete = (stepId: StepId, data?: any) => {
    // Store step data
    if (stepId === 'import-lists' && data) {
      setImportedLists(data);
    } else if (stepId === 'create-personas' && data) {
      setCreatedPersonas(data);
    } else if (stepId === 'import-contents' && data) {
      setImportedContent(data);
    }

    // Mark step as completed if not already
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }

    // Move to next step
    const steps: StepId[] = ['import-lists', 'create-personas', 'import-contents', 'generate-emails'];
    const currentIndex = steps.indexOf(stepId);
    
    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1]);
    }
  };

  // Check if user is authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/register');
    }
  }, [user, navigate]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Marketing Automation Workflow</CardTitle>
            <CardDescription className="text-center">
              Complete these steps to automate your email marketing campaigns
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeStep} className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger 
                  value="import-lists"
                  disabled={activeStep !== 'import-lists' && !completedSteps.includes('import-lists')}
                  onClick={() => completedSteps.includes('import-lists') && setActiveStep('import-lists')}
                  className={completedSteps.includes('import-lists') ? "text-green-600" : ""}
                >
                  1. Import Lists
                </TabsTrigger>
                <TabsTrigger 
                  value="create-personas"
                  disabled={activeStep !== 'create-personas' && !completedSteps.includes('create-personas')}
                  onClick={() => completedSteps.includes('create-personas') && setActiveStep('create-personas')}
                  className={completedSteps.includes('create-personas') ? "text-green-600" : ""}
                >
                  2. Create Personas
                </TabsTrigger>
                <TabsTrigger 
                  value="import-contents"
                  disabled={activeStep !== 'import-contents' && !completedSteps.includes('import-contents')}
                  onClick={() => completedSteps.includes('import-contents') && setActiveStep('import-contents')}
                  className={completedSteps.includes('import-contents') ? "text-green-600" : ""}
                >
                  3. Import Contents
                </TabsTrigger>
                <TabsTrigger 
                  value="generate-emails"
                  disabled={activeStep !== 'generate-emails' && !completedSteps.includes('generate-emails')}
                  onClick={() => completedSteps.includes('generate-emails') && setActiveStep('generate-emails')}
                  className={completedSteps.includes('generate-emails') ? "text-green-600" : ""}
                >
                  4. Generate Emails
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="import-lists" className="mt-4">
                <ImportListsStep onComplete={(data) => handleStepComplete('import-lists', data)} />
              </TabsContent>
              
              <TabsContent value="create-personas" className="mt-4">
                <CreatePersonasStep 
                  importedLists={importedLists} 
                  onComplete={(data) => handleStepComplete('create-personas', data)} 
                />
              </TabsContent>
              
              <TabsContent value="import-contents" className="mt-4">
                <ImportContentsStep onComplete={(data) => handleStepComplete('import-contents', data)} />
              </TabsContent>
              
              <TabsContent value="generate-emails" className="mt-4">
                <GenerateEmailsStep 
                  personas={createdPersonas} 
                  content={importedContent}
                  onComplete={() => handleStepComplete('generate-emails')} 
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketingAutomationPage;
