
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, ExternalLink, AlertTriangle } from 'lucide-react';
import IntegrationForm from '@/components/integration/IntegrationForm';
import StatusMessage from '@/components/integration/StatusMessage';

interface SetupWizardProps {
  onComplete: () => void;
  onBack: () => void;
}

const SetupWizard = ({ onComplete, onBack }: SetupWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [attemptedUrl, setAttemptedUrl] = useState('');
  const [responseDetails, setResponseDetails] = useState<{status?: number, data?: any}>();

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleIntegrationError = (
    message: string, 
    isNetwork: boolean,
    url?: string,
    details?: {status?: number, data?: any}
  ) => {
    setErrorMessage(message);
    setIsNetworkError(isNetwork);
    setAttemptedUrl(url || '');
    setResponseDetails(details);
    setSuccessMessage('');
  };

  const handleIntegrationSuccess = (message: string) => {
    setErrorMessage('');
    setIsNetworkError(false);
    setAttemptedUrl('');
    setResponseDetails(undefined);
    setSuccessMessage(message);
    setIsConnected(true);
    setTimeout(() => setCurrentStep(2), 1500);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect ActiveCampaign</h2>
        <p className="text-gray-600">
          DailyHack integrates with your ActiveCampaign account to manage your email campaigns seamlessly.
        </p>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-900 mb-1">Need your ActiveCampaign credentials?</h3>
            <p className="text-sm text-yellow-800 mb-3">
              You'll need your API URL and API Key from your ActiveCampaign account.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://www.activecampaign.com/login', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open ActiveCampaign
            </Button>
          </div>
        </div>
      </div>

      <StatusMessage 
        error={errorMessage} 
        success={successMessage} 
        isNetworkError={isNetworkError}
        attemptedUrl={attemptedUrl}
        responseDetails={responseDetails} 
      />
      
      <IntegrationForm 
        onError={handleIntegrationError}
        onSuccess={handleIntegrationSuccess}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ActiveCampaign Connected!</h2>
        <p className="text-gray-600">
          Great! Your account is now connected. Next, we'll help you set up your content sources and create your first avatar.
        </p>
      </div>
      <Button onClick={() => setCurrentStep(3)} className="px-6">
        Continue Setup <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
        <p className="text-gray-600 mb-6">
          You're ready to start creating AI-powered email campaigns. Let's create your first campaign together!
        </p>
      </div>
      <Button onClick={onComplete} size="lg" className="px-8">
        Start Creating Campaigns
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <Progress value={progress} className="mb-4" />
          <CardTitle className="text-center">Account Setup</CardTitle>
          <CardDescription className="text-center">
            Let's get your DailyHack account configured
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupWizard;
