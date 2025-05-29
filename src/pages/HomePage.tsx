import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import SetupWizard from '@/components/onboarding/SetupWizard';
import GuidedFirstCampaign from '@/components/onboarding/GuidedFirstCampaign';
import { fetchUserIntegrations } from '@/lib/api/integration';
import { getOnboardingCompleted, setOnboardingCompleted, getOnboardingStep, setOnboardingStep } from '@/lib/onboarding';

type OnboardingStep = 'welcome' | 'setup' | 'campaign' | 'completed';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [onboardingStep, setCurrentOnboardingStep] = useState<OnboardingStep>('welcome');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasIntegrations, setHasIntegrations] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserSetup = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const integrations = await fetchUserIntegrations(String(user.id));
          setHasIntegrations(integrations.length > 0);
          
          // Check if onboarding was completed
          const onboardingCompleted = getOnboardingCompleted();
          const savedStep = getOnboardingStep();
          
          console.log('Onboarding state:', { onboardingCompleted, savedStep, hasIntegrations: integrations.length > 0 });
          
          // Show onboarding if not completed OR if no integrations exist
          if (!onboardingCompleted || integrations.length === 0) {
            setShowOnboarding(true);
            // Set step based on current state
            if (integrations.length === 0) {
              setCurrentOnboardingStep('welcome');
              setOnboardingStep('welcome');
            } else if (savedStep === 'campaign' || savedStep === 'setup') {
              // User has integration but didn't complete campaign tutorial
              setCurrentOnboardingStep('campaign');
              setOnboardingStep('campaign');
            } else {
              setCurrentOnboardingStep(savedStep as OnboardingStep);
            }
          } else {
            setShowOnboarding(false);
          }
        } catch (error) {
          console.error('Error checking user setup:', error);
          // If we can't check, show onboarding to be safe
          setShowOnboarding(true);
        }
      }
      setIsLoading(false);
    };

    checkUserSetup();
  }, [isAuthenticated, user]);

  const handleOnboardingComplete = () => {
    console.log('Onboarding completed');
    setOnboardingCompleted(true);
    setOnboardingStep('completed');
    setShowOnboarding(false);
    setHasIntegrations(true);
  };

  const handleStepChange = (step: OnboardingStep) => {
    console.log('Onboarding step changed to:', step);
    setCurrentOnboardingStep(step);
    setOnboardingStep(step);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show onboarding flow for authenticated users who haven't completed it
  if (isAuthenticated && showOnboarding) {
    switch (onboardingStep) {
      case 'welcome':
        return (
          <WelcomeScreen 
            userName={user?.name}
            onGetStarted={() => handleStepChange('setup')}
          />
        );
      case 'setup':
        return (
          <SetupWizard 
            onComplete={() => handleStepChange('campaign')}
            onBack={() => handleStepChange('welcome')}
          />
        );
      case 'campaign':
        return (
          <GuidedFirstCampaign 
            onComplete={handleOnboardingComplete}
            onBack={() => handleStepChange('setup')}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">Welcome to DailyHack</h1>
        <p className="text-xl text-gray-600 mb-8">
          Transform your email marketing with AI-powered automation and our proven 5-agent methodology.
        </p>
        
        {!isAuthenticated ? (
          <div className="grid gap-6 md:grid-cols-2 mt-12">
            <Card>
              <CardHeader>
                <CardTitle>New to DailyHack?</CardTitle>
                <CardDescription>Create your account and experience the AI methodology.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Register for free and discover how our 5 AI agents work together to create 
                  high-performing email campaigns using our proven methodology.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/register">Start Free Trial</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Already registered?</CardTitle>
                <CardDescription>Log in to your dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access your AI agents, review campaign performance, and continue 
                  optimizing your email marketing strategy.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Log In</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {user?.name}!</CardTitle>
              <CardDescription>Your DailyHack dashboard is ready.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {hasIntegrations 
                  ? "Continue managing your AI-powered email campaigns and explore advanced features."
                  : "Complete your setup to start creating AI-powered email campaigns."
                }
              </p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              {hasIntegrations ? (
                <>
                  <Button asChild>
                    <Link to="/agents">View Agents</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/agents?mode=add">Add New Agent</Link>
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowOnboarding(true)}>
                  Complete Setup
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
        
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">5 AI Agents Methodology</h3>
            <p className="text-gray-600">
              Our specialized AI team (Researcher, Strategist, Writer, Reviewer, Optimizer) works together for optimal results.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Smart Content Aggregation</h3>
            <p className="text-gray-600">
              AI analyzes your content sources and customer data to create perfectly targeted email sequences.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Sprint Optimization Cycle</h3>
            <p className="text-gray-600">
              Continuous improvement through AI-powered analytics and performance optimization sprints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
