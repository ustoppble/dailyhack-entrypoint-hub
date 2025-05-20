
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, List, Target, Brain, Settings } from 'lucide-react';

const AgentCentralPage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const { user } = useAuth();

  if (!agentName) {
    return <div className="p-8 text-center">Agent name not found</div>;
  }

  const agentFeatures = [
    {
      title: "Lists",
      description: "View and manage subscriber lists",
      icon: <List className="h-6 w-6" />,
      link: `/agents/${agentName}/lists`,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Email Autopilot",
      description: "Configure automated email sequences",
      icon: <Mail className="h-6 w-6" />,
      link: `/agents/${agentName}/planner`,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Offers",
      description: "Create and manage offers",
      icon: <Target className="h-6 w-6" />,
      link: `/agents/${agentName}/offers`,
      color: "bg-purple-100 text-purple-700",
    },
    {
      title: "Knowledge Base",
      description: "Explore resources and documentation",
      icon: <Brain className="h-6 w-6" />,
      link: `/agents/${agentName}/kb`,
      color: "bg-amber-100 text-amber-700",
    },
    {
      title: "Settings",
      description: "Configure agent settings",
      icon: <Settings className="h-6 w-6" />,
      link: `/agents/${agentName}/settings`,
      color: "bg-slate-100 text-slate-700",
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{agentName}</h1>
          <p className="mt-2 text-gray-500">
            Control center for your ActiveCampaign agent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentFeatures.map((feature) => (
            <Card key={feature.title} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className={`${feature.color} p-4`}>
                <div className="flex items-center">
                  <div className="bg-white p-2 rounded-full mr-3">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <CardDescription className="text-gray-600">{feature.description}</CardDescription>
              </CardContent>
              <CardFooter className="border-t pt-4 pb-5">
                <Button asChild className="w-full">
                  <Link to={feature.link}>
                    Go to {feature.title}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentCentralPage;
