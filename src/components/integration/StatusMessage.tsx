
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, InfoIcon, WifiOff } from 'lucide-react';

interface StatusMessageProps {
  error?: string;
  success?: string;
  isNetworkError?: boolean;
  attemptedUrl?: string;
  responseDetails?: {
    status?: number;
    data?: any;
  };
}

const StatusMessage = ({ 
  error, 
  success, 
  isNetworkError,
  attemptedUrl,
  responseDetails 
}: StatusMessageProps) => {
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
                  <li>If our n8n webhook is accessible from your network</li>
                  <li>Firewall or network restrictions that might block API requests</li>
                </ul>
                {attemptedUrl && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                    <p>URL tentada: {attemptedUrl}</p>
                  </div>
                )}
                {responseDetails && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                    <p>Status: {responseDetails.status || 'N/A'}</p>
                    {responseDetails.data && (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(responseDetails.data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
                <p className="mt-2">
                  Tente usar uma conexão de rede diferente ou verifique se o
                  webhook n8n está disponível.
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Success message has been removed as requested */}
    </>
  );
};

export default StatusMessage;
