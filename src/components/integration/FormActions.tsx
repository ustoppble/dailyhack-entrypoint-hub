
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ExternalLink } from 'lucide-react';

interface FormActionsProps {
  isLoading: boolean;
  isVerifying: boolean;
  isRetrying: boolean;
  hasAttempted: boolean;
  onRetry: () => void;
}

const FormActions = ({ 
  isLoading, 
  isVerifying, 
  isRetrying, 
  hasAttempted,
  onRetry 
}: FormActionsProps) => {
  return (
    <div className="flex flex-col space-y-2">
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isVerifying ? "Verificando..." : "Conectando..."}
          </>
        ) : (
          "Conectar Conta"
        )}
      </Button>
      
      <Button 
        type="button" 
        variant="outline" 
        className="w-full" 
        onClick={() => window.open('https://www.activecampaign.com/login', '_blank')}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Acessar ActiveCampaign
      </Button>
      
      {hasAttempted && (
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          onClick={onRetry}
          disabled={isRetrying || isLoading}
        >
          {isRetrying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Tentar Novamente
        </Button>
      )}
    </div>
  );
};

export default FormActions;
