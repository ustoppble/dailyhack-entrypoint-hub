
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Target, 
  Zap, 
  Search, 
  PenTool, 
  CheckCircle, 
  ArrowRight,
  Brain,
  TrendingUp 
} from 'lucide-react';

interface GuidedFirstCampaignProps {
  onComplete: () => void;
  onBack: () => void;
}

const GuidedFirstCampaign = ({ onComplete, onBack }: GuidedFirstCampaignProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    avatar: '',
    objective: '',
    style: '',
    contentFocus: ''
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const agents = [
    {
      icon: Search,
      name: "Researcher",
      role: "Analyzes your content and finds relevant insights",
      color: "bg-blue-100 text-blue-800"
    },
    {
      icon: Brain,
      name: "Strategist", 
      role: "Plans the email sequence strategy based on your avatar",
      color: "bg-purple-100 text-purple-800"
    },
    {
      icon: PenTool,
      name: "Writer",
      role: "Creates compelling email content in your chosen style",
      color: "bg-green-100 text-green-800"
    },
    {
      icon: CheckCircle,
      name: "Technical Reviewer",
      role: "Ensures emails are optimized for deliverability",
      color: "bg-orange-100 text-orange-800"
    },
    {
      icon: TrendingUp,
      name: "Performance Optimizer",
      role: "Analyzes results and suggests improvements",
      color: "bg-red-100 text-red-800"
    }
  ];

  const styles = [
    { name: "Nurturing", description: "Build relationships and trust with valuable content" },
    { name: "Soft Sell", description: "Gentle introduction of products with education focus" },
    { name: "Hard Sell", description: "Direct promotional approach with clear CTAs" },
    { name: "Event", description: "Time-sensitive announcements and invitations" }
  ];

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Meet Your AI Team</h2>
        <p className="text-gray-600">
          DailyHack uses 5 specialized AI agents that work together to create high-performing email campaigns.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {agents.map((agent, index) => (
          <div key={index} className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <agent.icon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                <Badge className={agent.color}>{index + 1}</Badge>
              </div>
              <p className="text-sm text-gray-600">{agent.role}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <Button onClick={() => setCurrentStep(2)} className="px-6">
          Let's Create Your First Campaign <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Your Avatar</h2>
        <p className="text-gray-600">
          An avatar is your ideal customer profile. This helps our AI create targeted, relevant content.
        </p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">For this tutorial, let's use:</h3>
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-900">Small Business Owner</h4>
          <p className="text-sm text-gray-600 mt-1">
            Entrepreneurs running businesses with 1-10 employees, looking to grow their revenue through better marketing and operations.
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <Button 
          onClick={() => {
            setCampaignData({...campaignData, avatar: 'Small Business Owner'});
            setCurrentStep(3);
          }} 
          className="px-6"
        >
          Use This Avatar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Communication Style</h2>
        <p className="text-gray-600">
          Different situations call for different approaches. Select the style that matches your campaign goal.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {styles.map((style, index) => (
          <button
            key={index}
            onClick={() => {
              setCampaignData({...campaignData, style: style.name});
              setCurrentStep(4);
            }}
            className="flex items-start space-x-4 p-4 bg-white rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{style.name}</h3>
              <p className="text-sm text-gray-600">{style.description}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Zap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Agents at Work</h2>
        <p className="text-gray-600">
          Watch as your AI team collaborates to create a personalized email sequence.
        </p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Campaign Configuration:</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Avatar:</span>
            <span className="font-medium">{campaignData.avatar}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Style:</span>
            <span className="font-medium">{campaignData.style}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sequence Length:</span>
            <span className="font-medium">5 emails</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
          <Search className="w-5 h-5 text-blue-600" />
          <span className="text-sm">Researcher analyzing your content sources...</span>
          <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
        </div>
        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
          <Brain className="w-5 h-5 text-purple-600" />
          <span className="text-sm">Strategist planning email sequence...</span>
          <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
        </div>
        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
          <PenTool className="w-5 h-5 text-green-600" />
          <span className="text-sm">Writer creating compelling content...</span>
          <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
        </div>
      </div>
      
      <div className="text-center">
        <Button onClick={() => setCurrentStep(5)} className="px-6">
          View Generated Campaign <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your First Campaign is Ready!</h2>
        <p className="text-gray-600">
          Congratulations! You've just experienced the DailyHack methodology in action.
        </p>
      </div>
      
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Generated Email Sequence Preview:</h3>
        <div className="space-y-3">
          {[
            "Welcome: Building Your Business Foundation",
            "The #1 Mistake Small Businesses Make",
            "3 Simple Systems That Changed Everything", 
            "Case Study: From Chaos to $100K",
            "Your Next Step Forward"
          ].map((subject, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <Badge variant="outline">{index + 1}</Badge>
              <span className="text-sm font-medium">{subject}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Review and customize your email content</li>
          <li>• Set up automated scheduling</li>
          <li>• Monitor performance with AI-powered analytics</li>
          <li>• Optimize based on the Sprint methodology</li>
        </ul>
      </div>
      
      <div className="text-center">
        <Button onClick={onComplete} size="lg" className="px-8">
          Go to Dashboard
        </Button>
      </div>
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
          <CardTitle className="text-center">Your First Campaign</CardTitle>
          <CardDescription className="text-center">
            Learn the DailyHack methodology by creating your first AI-powered email sequence
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </CardContent>
      </Card>
    </div>
  );
};

export default GuidedFirstCampaign;
