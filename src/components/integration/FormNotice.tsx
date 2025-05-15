
import React from 'react';

const FormNotice = () => {
  return (
    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
      <h4 className="font-medium mb-1">🔄 Usando n8n para verificação</h4>
      <p className="mb-2">
        Esta integração utiliza um webhook n8n para verificar as credenciais 
        do ActiveCampaign, contornando problemas de CORS no navegador.
      </p>
    </div>
  );
};

export default FormNotice;
