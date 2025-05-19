
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, List, BookOpen } from 'lucide-react';

interface PageHeaderProps {
  agentName: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ agentName }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/agents/${agentName}/central`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Central
        </Button>
        <h1 className="text-3xl font-bold">{agentName}</h1>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => navigate(`/agents/${agentName}/lists`)}
        >
          <List className="h-4 w-4" /> Lists
        </Button>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => navigate(`/agents/${agentName}/knowledge`)}
        >
          <BookOpen className="h-4 w-4" /> Knowledge
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
