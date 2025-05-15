
import axios from 'axios';
import { VerificationResult } from '../types';
import { formatApiUrl } from '../utils/url-formatter';

/**
 * N8n webhook URL for ActiveCampaign verification
 */
const N8N_WEBHOOK_URL = 'https://primary-production-2e546.up.railway.app/webhook/d935a725-80e0-405e-8a15-74554dbbc1bd';

/**
 * Verify ActiveCampaign credentials using n8n webhook
 */
export const verifyActiveCampaignCredentials = async (
  apiUrl: string,
  apiToken: string
): Promise<VerificationResult> => {
  try {
    console.log('Verifying ActiveCampaign credentials for URL:', apiUrl);
    console.log('Using n8n webhook for verification');
    
    // Format API URL correctly
    const formattedApiUrl = formatApiUrl(apiUrl);
    
    // Build the webhook URL with query parameters
    const webhookUrlWithParams = `${N8N_WEBHOOK_URL}?url=${encodeURIComponent(formattedApiUrl)}&token=${encodeURIComponent(apiToken)}`;
    
    console.log('Making request to n8n webhook');
    
    try {
      // Make request to n8n webhook
      const response = await axios.get(webhookUrlWithParams, {
        timeout: 15000, // 15 second timeout
      });
      
      console.log('n8n webhook response:', response.data);
      
      // n8n webhook returns "true" if successful, "false" if failed
      const isSuccess = response.data === true || response.data === "true";
      
      if (isSuccess) {
        return {
          success: true,
          message: 'Connection successful',
          attemptedUrl: formattedApiUrl
        };
      } else {
        return {
          success: false,
          message: 'Credenciais inválidas ou problema de conexão com o ActiveCampaign',
          attemptedUrl: formattedApiUrl
        };
      }
    } catch (axiosError: any) {
      console.error('n8n webhook request error:', axiosError);
      
      // More detailed error handling for axios errors
      if (axiosError.response) {
        console.error('Response data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
        
        return { 
          success: false, 
          message: `Erro ao contatar o webhook n8n: ${axiosError.response.status} - ${axiosError.response.data || 'Erro desconhecido'}`,
          attemptedUrl: formattedApiUrl
        };
      } else if (axiosError.request) {
        console.error('No response received:', axiosError.request);
        
        return { 
          success: false,
          isNetworkError: true,
          message: `Nenhuma resposta recebida do webhook n8n. Verifique sua conexão com a internet.`,
          attemptedUrl: formattedApiUrl
        };
      } else {
        console.error('Error message:', axiosError.message);
        return { 
          success: false, 
          isNetworkError: axiosError.message.includes('network'),
          message: `Erro: ${axiosError.message}`,
          attemptedUrl: formattedApiUrl
        };
      }
    }
  } catch (error: any) {
    console.error('ActiveCampaign verification general error:', error);
    return { 
      success: false,
      isNetworkError: error.message?.includes('network'),
      message: error.message || 'Ocorreu um erro inesperado durante a verificação.'
    };
  }
};
