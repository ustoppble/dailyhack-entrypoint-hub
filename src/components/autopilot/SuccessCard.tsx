
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle } from 'lucide-react';

interface SuccessCardProps {
  success: string;
  agentName: string;
}

const SuccessCard: React.FC<SuccessCardProps> = ({ success, agentName }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="shadow-md mb-6">
      <CardHeader className="border-b bg-green-50">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <CardTitle className="text-xl font-bold">Email Autopilot Activated</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <AlertDescription className="text-center py-4">
            {success}
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button 
            onClick={() => navigate(`/agents/${agentName}/central`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Central
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuccessCard;
