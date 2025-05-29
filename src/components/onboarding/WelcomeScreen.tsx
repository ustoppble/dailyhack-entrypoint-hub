
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Zap, BarChart3, Target } from 'lucide-react';

interface WelcomeScreenProps {
  userName?: string;
  onGetStarted: () => void;
}

const WelcomeScreen = ({ userName, onGetStarted }: WelcomeScreenProps) => {
  const methodology = [
    {
      icon: Users,
      title: "Avatar Definition",
      description: "Define your ideal customer profile for targeted messaging"
    },
    {
      icon: Target,
      title: "Smart Content Aggregation", 
      description: "AI analyzes your content sources to create relevant emails"
    },
    {
      icon: Zap,
      title: "5 AI Agents",
      description: "Researcher, Strategist, Writer, Technical Reviewer & Performance Optimizer"
    },
    {
      icon: BarChart3,
      title: "Sprint Optimization Cycle",
      description: "Continuous improvement based on performance analytics"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome to DailyHack{userName ? `, ${userName}` : ''}!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            Transform your email marketing with our AI-powered methodology. Let's get you started in just a few minutes.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {methodology.map((step, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What you'll accomplish in the next 10 minutes:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                Connect your ActiveCampaign account
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                Set up your first content source
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                Define your primary avatar
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                Generate your first AI-powered email sequence
              </li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Start Your Journey
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeScreen;
