
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  agentName: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ agentName }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/agents/${agentName}/central`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Central
        </Button>
        <h1 className="text-xl md:text-3xl font-bold">{agentName}</h1>
      </div>
    </div>
  );
};

export default PageHeader;
