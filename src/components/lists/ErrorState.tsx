
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  const navigate = useNavigate();
  
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      navigate('/integrate');
    }
  };
  
  return (
    <div className="bg-red-50 p-4 rounded-lg text-center">
      <p className="text-red-600">{error}</p>
      <Button 
        variant="outline" 
        className="mt-4" 
        onClick={handleRetry}
      >
        {onRetry ? "Try Again" : "Back to Agent Setup"}
      </Button>
    </div>
  );
};

export default ErrorState;
