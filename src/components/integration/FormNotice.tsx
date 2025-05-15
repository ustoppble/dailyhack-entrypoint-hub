
import React from 'react';
import { Info } from 'lucide-react';

const FormNotice = () => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4 flex items-start">
      <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-medium mb-1">🔄 Usando n8n para verificação</h4>
        <p className="mb-2">
          Esta integração utiliza um webhook n8n para verificar as credenciais 
          do ActiveCampaign, contornando problemas de CORS no navegador.
        </p>
        <p className="text-xs opacity-80">
          Nota: Este é um processo seguro que não armazena suas credenciais de API.
        </p>
      </div>
    </div>
  );
};

export default FormNotice;
