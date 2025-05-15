
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, InfoIcon, CheckCircle } from 'lucide-react';

interface StatusMessageProps {
  error?: string;
  success?: string;
  isNetworkError?: boolean;
}

const StatusMessage = ({ error, success, isNetworkError }: StatusMessageProps) => {
  if (!error && !success) return null;
  
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {isNetworkError ? "Network Error" : "Error"}
          </AlertTitle>
          <AlertDescription>
            {error}
            {isNetworkError && (
              <div className="mt-2 text-xs">
                Please check your internet connection and try again. If the problem persists, 
                verify your API URL format and API token.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default StatusMessage;
