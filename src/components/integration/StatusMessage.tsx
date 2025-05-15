
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, InfoIcon, CheckCircle, WifiOff } from 'lucide-react';

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
                  <li>If ActiveCampaign is accessible from your network</li>
                  <li>Firewall or network restrictions that might block API requests</li>
                  <li>CORS settings in your browser</li>
                </ul>
                {attemptedUrl && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                    <p>Attempted URL: {attemptedUrl}</p>
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
                  Tente usar uma conexão de rede diferente ou acessar o ActiveCampaign diretamente
                  para confirmar que o serviço está disponível.
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
