
import axios from 'axios';
import { EmailList } from './types';

const WEBHOOK_URL = 'https://primary-production-2e546.up.railway.app/webhook/62a0cea6-c1c6-48eb-8d76-5c55a270dbbc';

/**
 * Fetch email lists from ActiveCampaign via n8n webhook
 */
export const fetchEmailLists = async (apiUrl: string, apiToken: string): Promise<EmailList[]> => {
  try {
    console.log('Fetching ActiveCampaign lists for URL:', apiUrl);
    
    // Using GET request with query parameters instead of POST
    const response = await axios.get(WEBHOOK_URL, {
      params: {
        api: apiUrl,
        token: apiToken
      },
      timeout: 15000, // 15 second timeout
    });
    
    console.log('n8n webhook response for lists:', response.data);
    
    if (response.data && response.data.output && Array.isArray(response.data.output)) {
      return response.data.output;
    }
    
    throw new Error('Invalid response format from webhook');
  } catch (error: any) {
    console.error('Error fetching email lists:', error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      throw new Error(`Error fetching lists: ${error.response.status} - ${error.response.data || 'Unknown error'}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response received from webhook. Check your internet connection.');
    }
    
    throw error;
  }
};

/**
 * Save selected lists to user preferences
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
