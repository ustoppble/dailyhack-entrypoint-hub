import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import SetupWizard from '@/components/onboarding/SetupWizard';
import GuidedFirstCampaign from '@/components/onboarding/GuidedFirstCampaign';
import { fetchUserIntegrations } from '@/lib/api/integration';
import { getOnboardingCompleted, setOnboardingCompleted, getOnboardingStep, setOnboardingStep } from '@/lib/onboarding';
import { useDemoAnalysis } from '@/hooks/useDemoAnalysis';
import { Zap, Link as LinkIcon, Circle } from 'lucide-react';

type OnboardingStep = 'welcome' | 'setup' | 'campaign' | 'completed';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [onboardingStep, setCurrentOnboardingStep] = useState<OnboardingStep>('welcome');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasIntegrations, setHasIntegrations] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { url, setUrl, isValid, isAnalyzing, analyzeUrl } = useDemoAnalysis();

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

  const handleDemoSubmit = () => {
    if (isValid && url) {
      analyzeUrl();
    }
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
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full inline-block mb-6">
            <span className="font-bold">PRIMEIRO EMAIL GRÁTIS</span>
            <span className="mx-2">→</span>
            <span className="font-bold">AUTOPILOT AUTOMÁTICO</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            "Cole 1 link, ganhe emails que vendem para sempre"
          </h1>
        </div>

        {/* Como Funciona */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center">
            <Zap className="w-6 h-6 mr-2 text-yellow-500" />
            COMO FUNCIONA:
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <p className="text-gray-700">
                Cole seu link agora (aceito Reels de Instagram, Vídeo de YouTube ou Link de site)
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <p className="text-gray-700">
                IA gera email profissional + dispara automático
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <p className="text-gray-700">
                Sistema cria emails novos toda semana (autopilot)
              </p>
            </div>
          </div>
        </div>

        {/* Demo Form */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              📱 COLE SEU MELHOR CONTEÚDO:
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type="url"
                placeholder="https://____________________"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`h-14 text-lg ${
                  url && isValid ? 'border-green-500' : 
                  url && !isValid ? 'border-red-500' : 
                  'border-gray-300'
                }`}
              />
              {url && isValid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                </div>
              )}
            </div>
            
            {url && !isValid && (
              <p className="text-red-500 text-sm">
                Por favor, cole um link válido do YouTube, Instagram ou site
              </p>
            )}
          </CardContent>
          
          <CardFooter className="text-center">
            <div className="w-full space-y-4">
              <p className="text-lg font-bold text-gray-900">
                🔥 Sistema já criou R$ 2.3M em vendas automáticas
              </p>
              
              <Button
                onClick={handleDemoSubmit}
                disabled={!isValid || isAnalyzing}
                size="lg"
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {isAnalyzing ? 'ANALISANDO...' : 'DISPARAR EMAIL AUTOMÁTICO GRÁTIS'}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Login/Register for existing users */}
        {!isAuthenticated && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">Já tem conta?</p>
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link to="/login">Fazer Login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/register">Criar Conta</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Authenticated user dashboard */}
        {isAuthenticated && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Bem-vindo de volta, {user?.name}!</CardTitle>
              <CardDescription>Acesse seu painel de controle</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center gap-4">
              <Button asChild>
                <Link to="/agents">Ver Agentes</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/agents?mode=add">Adicionar Agente</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HomePage;
