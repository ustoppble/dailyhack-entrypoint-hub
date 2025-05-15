
import axios from 'axios';
import { EmailList } from './types';

interface ListsResponse {
  output: EmailList[];
}

const N8N_WEBHOOK_URL = 'https://primary-production-2e546.up.railway.app/webhook/62a0cea6-c1c6-48eb-8d76-5c55a270dbbc';

/**
 * Fetch email lists from ActiveCampaign via n8n webhook
 */
export const fetchEmailLists = async (apiUrl: string, apiToken: string): Promise<EmailList[]> => {
  try {
    console.log('Fetching ActiveCampaign lists for URL:', apiUrl);
    
    // Build the webhook URL with query parameters
    const webhookUrlWithParams = `${N8N_WEBHOOK_URL}?url=${encodeURIComponent(apiUrl)}&token=${encodeURIComponent(apiToken)}`;
    
    console.log('Making request to n8n webhook to fetch lists');
    
    const response = await axios.get(webhookUrlWithParams, {
      timeout: 15000, // 15 second timeout
    });
    
    console.log('n8n webhook response for lists:', response.data);
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      // The response should be an array with at least one object containing an output array
      const lists = response.data[0]?.output;
      
      if (Array.isArray(lists)) {
        return lists;
      }
    }
    
    throw new Error('Formato de resposta inválido do webhook n8n');
  } catch (error: any) {
    console.error('Error fetching email lists:', error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      throw new Error(`Erro ao buscar listas: ${error.response.status} - ${error.response.data || 'Erro desconhecido'}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Nenhuma resposta recebida do webhook n8n. Verifique sua conexão com a internet.');
    }
    
    throw error;
  }
};

/**
 * Save selected email lists to user preferences
 */
export const saveSelectedLists = async (userId: string, selectedLists: string[]): Promise<boolean> => {
  try {
    console.log('Saving selected lists for user:', userId, selectedLists);
    
    // Here you would typically make an API call to save the user's selected lists
    // For now, we'll just simulate a successful response
    
    // Example of how this might work with your Airtable integration:
    /*
    const response = await airtableIntegrationApi.post('', {
      records: [
        {
          fields: {
            id_users: userId,
            selected_lists: selectedLists.join(','),
            DateUpdated: new Date().toISOString()
          },
        },
      ],
    });
    
    return response.data.records && response.data.records.length > 0;
    */
    
    // For now, just return true to simulate success
    return true;
  } catch (error: any) {
    console.error('Error saving selected lists:', error);
    throw error;
  }
};
