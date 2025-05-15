
import axios from 'axios';
import { EmailList } from './types';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } from './constants';

const WEBHOOK_URL = 'https://primary-production-2e546.up.railway.app/webhook/62a0cea6-c1c6-48eb-8d76-5c55a270dbbc';
const AIRTABLE_LISTS_TABLE_ID = 'tblhqy7BdNwj0SPHD';

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
 * Save selected lists to Airtable with all required fields
 */
export const saveSelectedLists = async (userId: string, selectedLists: EmailList[]): Promise<boolean> => {
  try {
    console.log('Saving selected lists for user:', userId, selectedLists);
    
    // Create records for Airtable
    const records = selectedLists.map(list => ({
      fields: {
        Name: list.name,
        description: list.sender_reminder || '',
        Insight: list.Insight || '',
        leads: parseInt(list.active_subscribers) || 0,
        id_users: userId
      }
    }));
    
    // Save to Airtable
    const response = await axios.post(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_LISTS_TABLE_ID}`,
      { records },
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Airtable save response:', response.data);
    
    return response.data.records && response.data.records.length > 0;
  } catch (error: any) {
    console.error('Error saving selected lists to Airtable:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};
