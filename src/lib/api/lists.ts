
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
    console.log('Using token:', apiToken);
    
    // Using GET request with query parameters
    const response = await axios.get(WEBHOOK_URL, {
      params: {
        api: apiUrl,
        token: apiToken
      },
      timeout: 30000, // Increase timeout to 30 seconds
    });
    
    console.log('n8n webhook response for lists:', response.data);
    
    if (response.data && response.data.output && Array.isArray(response.data.output)) {
      return response.data.output.map((item: any) => ({
        ...item,
        // Map the field with the correct case to our lowercase property
        insight: item.Insight || item.insight || ''
      }));
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
      throw new Error('No response received from webhook. Check your internet connection or try again later.');
    }
    
    throw error;
  }
};

/**
 * Fetch connected lists from Airtable
 */
export const fetchConnectedLists = async (agentName: string, userId?: string): Promise<{id: string, name: string, subscribers: string, airtableId?: string, list_id?: string}[]> => {
  try {
    console.log('Fetching connected lists for agent:', agentName, 'and user:', userId);
    
    // Build the filter formula with user ID as a number
    let filterByFormula = `{activehosted}='${agentName}'`;
    
    // Only include lists that belong to the current user if userId is provided
    if (userId) {
      // Convert userId to number and use numeric comparison in formula
      const userIdNum = Number(userId);
      filterByFormula = `AND(${filterByFormula}, {id_users}=${userIdNum})`;
    }
    
    const encodedFilter = encodeURIComponent(filterByFormula);
    const response = await axios.get(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_LISTS_TABLE_ID}?filterByFormula=${encodedFilter}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Connected lists response:', response.data);
    
    // Extract list names and ids from the response
    if (response.data && response.data.records) {
      return response.data.records.map((record: any) => ({
        id: record.id, // This is the Airtable record ID
        name: record.fields.list_name,
        subscribers: record.fields.list_leads || "0",
        airtableId: record.id, // Adding the Airtable record ID for deletion
        list_id: record.fields.list_id // Include the actual list_id from ActiveCampaign
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching connected lists:', error);
    // Return empty array on error, don't throw
    return [];
  }
};

/**
 * Save selected lists to Airtable with all required fields
 */
export const saveSelectedLists = async (userId: string, selectedLists: EmailList[], agentName?: string): Promise<boolean> => {
  try {
    console.log('Saving selected lists for user:', userId, selectedLists);
    
    // Convert userId to a number for Airtable
    const userIdNumber = Number(userId);
    
    // Validate that userIdNumber is actually a valid number
    if (isNaN(userIdNumber)) {
      throw new Error('Invalid user ID format. Must be convertible to a number.');
    }
    
    // Log the exact value being sent to Airtable
    console.log('Using numeric user ID for Airtable:', userIdNumber);
    
    // Create records for Airtable with the correct column names
    const records = selectedLists.map(list => {
      // Make sure all values are strings except id_users which is a number
      const subscribersCount = list.active_subscribers ? String(list.active_subscribers).trim() : "0";
      
      return {
        fields: {
          list_name: list.name,
          list_description: list.sender_reminder || '',
          list_insight: list.insight || '',
          list_leads: subscribersCount,
          list_id: list.id || '',
          activehosted: agentName || '',
          // Send id_users as a number to Airtable
          id_users: userIdNumber
        }
      };
    });
    
    console.log('Sending records to Airtable:', JSON.stringify(records));
    
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

/**
 * Delete a connected list from Airtable
 */
export const deleteConnectedList = async (airtableRecordId: string): Promise<boolean> => {
  try {
    console.log('Deleting connected list with Airtable record ID:', airtableRecordId);
    
    const response = await axios.delete(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_LISTS_TABLE_ID}/${airtableRecordId}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Airtable delete response:', response.data);
    
    return true;
  } catch (error: any) {
    console.error('Error deleting connected list from Airtable:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};
