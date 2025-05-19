
import { airtableApi } from './client';
import { AIRTABLE_BASE_ID } from './constants';

// Airtable table ID for the autopilot data
const AIRTABLE_AUTOPILOT_TABLE_ID = 'tblfN4S5R9BNqT5Zk';

// Create a new autopilot record
export const createAutopilotRecord = async (
  listId: string, 
  url: string, 
  cronId: number
): Promise<boolean> => {
  try {
    // Create a direct API instance for the autopilot table
    const autopilotApiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_AUTOPILOT_TABLE_ID}`;
    
    // Prepare the record data
    const recordData = {
      records: [
        {
          fields: {
            id_list: listId,
            url: url,
            id_cron: cronId
          }
        }
      ]
    };
    
    console.log('Creating autopilot record:', recordData);
    
    // Make the API call
    const response = await fetch(autopilotApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableApi.defaults.headers.Authorization}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recordData)
    });
    
    const data = await response.json();
    console.log('Autopilot record created:', data);
    
    return true;
  } catch (error) {
    console.error('Error creating autopilot record:', error);
    return false;
  }
};
