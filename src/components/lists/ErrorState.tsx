
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
}

const ErrorState = ({ error }: ErrorStateProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-red-50 p-4 rounded-lg text-center">
      <p className="text-red-600">{error}</p>
      <Button 
        variant="outline" 
        className="mt-4" 
        onClick={() => navigate('/integrate')}
      >
        Back to Integration
      </Button>
    </div>
  );
};

export default ErrorState;
