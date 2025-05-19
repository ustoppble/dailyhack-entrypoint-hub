
import { airtableApi } from './client';
import { AIRTABLE_BASE_ID, AIRTABLE_API_KEY } from './constants';

// Airtable table ID for the autopilot data
const AIRTABLE_AUTOPILOT_TABLE_ID = 'tblfN4S5R9BNqT5Zk';

// Enhanced interface for autopilot records
export interface AutopilotRecord {
  id: string;
  listId: number;
  listName?: string;
  cronId: number;
  url: string;
  createdTime?: string;
}

// Create a new autopilot record
export const createAutopilotRecord = async (
  listId: string, 
  url: string, 
  cronId: number
): Promise<boolean> => {
  try {
    // Create a direct API instance for the autopilot table
    const autopilotApiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_AUTOPILOT_TABLE_ID}`;
    
    // Prepare the record data - converting string values to match Airtable's expected format
    const recordData = {
      records: [
        {
          fields: {
            // Convert all fields to proper types as required by Airtable
            "id_list": Number(listId), // Convert to number since Airtable expects a number
            "url": url,
            "id_cron": cronId
          }
        }
      ]
    };
    
    console.log('Creating autopilot record:', recordData);
    
    // Make the API call with the correct Authorization header
    const response = await fetch(autopilotApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recordData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error:', errorData);
      throw new Error(`Airtable API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log('Autopilot record created:', data);
    
    return true;
  } catch (error) {
    console.error('Error creating autopilot record:', error);
    return false;
  }
};

// Fetch existing autopilot records for a specific agent/URL
export const fetchAutopilotRecords = async (url: string): Promise<AutopilotRecord[]> => {
  try {
    // Create a direct API instance for the autopilot table
    const autopilotApiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_AUTOPILOT_TABLE_ID}`;
    
    // Add URL filter to only get records for this agent
    const filterFormula = encodeURIComponent(`{url} = "${url}"`);
    const fullUrl = `${autopilotApiUrl}?filterByFormula=${filterFormula}`;
    
    console.log('Fetching autopilot records for URL:', url);
    
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error when fetching autopilot records:', errorData);
      throw new Error(`Airtable API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Autopilot records fetched:', data);
    
    // Extract the list IDs and cron IDs from the response with more complete information
    const records = data.records.map((record: any) => ({
      id: record.id,
      listId: record.fields.id_list,
      cronId: record.fields.id_cron,
      url: record.fields.url,
      createdTime: record.createdTime
    }));
    
    return records;
  } catch (error) {
    console.error('Error fetching autopilot records:', error);
    return [];
  }
};
