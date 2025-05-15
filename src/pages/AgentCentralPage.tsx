
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, BookOpen, Mail } from 'lucide-react';

const AgentCentralPage = () => {
  const { agentName } = useParams<{ agentName: string }>();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center">{agentName} Central</h1>
          <p className="text-center text-gray-500 mt-2">Manage your ActiveCampaign agent</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <List className="mr-2" />
                Lists
              </CardTitle>
              <CardDescription>
                Manage your email lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View and manage your ActiveCampaign email lists.
              </p>
              <Button asChild className="w-full">
                <Link to={`/agents/${agentName}/lists`}>Manage Lists</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2" />
                Knowledge Base
              </CardTitle>
              <CardDescription>
                Manage your agent's knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Add and manage knowledge for your ActiveCampaign agent.
              </p>
              <Button asChild className="w-full">
                <Link to={`/agents/${agentName}/knowledge`}>Manage Knowledge</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2" />
                Email Planner
              </CardTitle>
              <CardDescription>
                Plan and draft email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Create and plan email campaigns with AI assistance.
              </p>
              <Button asChild className="w-full">
                <Link to={`/agents/${agentName}/email-planner`}>Plan Emails</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentCentralPage;
