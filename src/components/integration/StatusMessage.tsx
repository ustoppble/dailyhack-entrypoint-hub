
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, InfoIcon, CheckCircle, WifiOff } from 'lucide-react';

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
          {isNetworkError ? <WifiOff className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>
            {isNetworkError ? "Network Error" : "Error"}
          </AlertTitle>
          <AlertDescription>
            {error}
            {isNetworkError && (
              <div className="mt-2 text-xs">
                <p>Please check:</p>
                <ul className="list-disc pl-4 mt-1">
                  <li>Your internet connection</li>
                  <li>If ActiveCampaign is accessible from your network</li>
                  <li>Firewall or network restrictions that might block API requests</li>
                  <li>CORS settings in your browser</li>
                </ul>
                <p className="mt-2">
                  Try using a different network connection or accessing ActiveCampaign directly 
                  to confirm their service is available.
                </p>
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
