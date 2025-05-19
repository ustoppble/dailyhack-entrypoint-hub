import { airtableApi } from './client';
import { AIRTABLE_BASE_ID, AIRTABLE_API_KEY } from './constants';

// Airtable table ID for the autopilot data
const AIRTABLE_AUTOPILOT_TABLE_ID = 'tblfN4S5R9BNqT5Zk';
// Airtable table ID for the emails data
const AIRTABLE_EMAILS_TABLE_ID = 'tblWeAwzXeMhK7P6z';

// Enhanced interface for autopilot records
export interface AutopilotRecord {
  id: string;
  listId: number;
  listName?: string;
  cronId: number;
  url: string;
  offerId?: string;
  createdTime?: string;
}

// Interface for email records
export interface EmailRecord {
  id: string;
  date: string;
  title: string;
  campaign_name: string;
  id_email: number;
  status: number;
  content?: string;
  list_id: number;
  activehosted?: string;
  date_set?: string; // Added date_set field
}

// Create a new autopilot record
export const createAutopilotRecord = async (
  listId: string, 
  url: string, 
  cronId: number,
  offerId?: string
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
            "id_cron": cronId,
            // Use the numeric value from the offer instead of the Airtable record ID
            ...(offerId ? { "id_offer": getNumericOfferId(offerId) } : {}) 
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

// Extract the numeric ID from the campaign goal ID
// This is needed because Airtable expects a number for id_offer, not a record ID
const getNumericOfferId = (recordId: string): number => {
  // Try to find a number at the end of the string (like "recTaU2whfyY0rLSC" -> extract 4 from campaign goal fields)
  const goal = {
    "recQG4f2htaV2ZKQ5": 1,
    "recTaU2whfyY0rLSC": 4,
    "recn1xsQEZcFfUWh3": 5,
    "recg5uXLPbNfVU441": 6,
  };
  
  // Return the numeric value or 0 if not found
  return goal[recordId as keyof typeof goal] || 0;
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
      offerId: getRecordIdForOfferId(record.fields.id_offer),
      createdTime: record.createdTime
    }));
    
    return records;
  } catch (error) {
    console.error('Error fetching autopilot records:', error);
    return [];
  }
};

// Convert numeric offer ID back to record ID
const getRecordIdForOfferId = (numericId: number): string | undefined => {
  if (!numericId) return undefined;
  
  const mapping: Record<number, string> = {
    1: "recQG4f2htaV2ZKQ5",
    4: "recTaU2whfyY0rLSC",
    5: "recn1xsQEZcFfUWh3",
    6: "recg5uXLPbNfVU441",
  };
  
  return mapping[numericId];
};

// Delete an autopilot record
export const deleteAutopilotRecord = async (recordId: string): Promise<boolean> => {
  try {
    const autopilotApiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_AUTOPILOT_TABLE_ID}/${recordId}`;
    
    console.log('Deleting autopilot record:', recordId);
    
    const response = await fetch(autopilotApiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error when deleting autopilot:', errorData);
      throw new Error(`Airtable API error: ${response.status}`);
    }
    
    console.log('Autopilot record deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting autopilot record:', error);
    return false;
  }
};

// Update an autopilot record
export const updateAutopilotRecord = async (
  recordId: string,
  listId: string,
  cronId: number,
  offerId?: string
): Promise<boolean> => {
  try {
    const autopilotApiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_AUTOPILOT_TABLE_ID}/${recordId}`;
    
    // Prepare the updated data
    const updateData = {
      fields: {
        "id_list": Number(listId),
        "id_cron": cronId,
        // Use the numeric value from the offer instead of the Airtable record ID
        ...(offerId ? { "id_offer": getNumericOfferId(offerId) } : {})
      }
    };
    
    console.log('Updating autopilot record:', updateData);
    
    const response = await fetch(autopilotApiUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error when updating autopilot:', errorData);
      throw new Error(`Airtable API error: ${response.status}`);
    }
    
    console.log('Autopilot record updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating autopilot record:', error);
    return false;
  }
};

// Fetch emails for a specific list and activehosted
export const fetchEmailsForList = async (listId: number, agentName: string): Promise<EmailRecord[]> => {
  try {
    // Get emails from the emails table with both list_id and activehosted filters
    const emailsApiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_EMAILS_TABLE_ID}`;
    
    // Add combined filter for both list_id and activehosted
    const filterFormula = encodeURIComponent(`AND({list_id} = ${listId}, {activehosted} = "${agentName}")`);
    const fullUrl = `${emailsApiUrl}?filterByFormula=${filterFormula}`;
    
    console.log('Fetching emails for list ID:', listId, 'and agent:', agentName);
    
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error when fetching emails:', errorData);
      throw new Error(`Airtable API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Raw email data from Airtable:', data.records);
    
    // Map the Airtable response to our EmailRecord interface
    const emails = data.records.map((record: any) => {
      // Log each date field to help with debugging
      console.log(`Email ID ${record.id} has date:`, record.fields.date);
      console.log(`Email ID ${record.id} has date_set:`, record.fields.date_set);
      
      // Extract actual date from date_set field if available
      let dateValue = '';
      if (record.fields.date_set) {
        if (typeof record.fields.date_set === 'string') {
          dateValue = record.fields.date_set;
        } else if (record.fields.date_set && typeof record.fields.date_set === 'object') {
          // If it's an object, try to get the value property
          dateValue = record.fields.date_set.value || '';
        }
      }
      
      return {
        id: record.id,
        date: dateValue,
        date_set: dateValue, // Use date_set as our primary date field
        title: record.fields.title || '',
        campaign_name: record.fields.campaign_name || '',
        id_email: record.fields.id_email,
        status: record.fields.status || 0,
        content: record.fields.content || '',
        list_id: record.fields.list_id,
        activehosted: record.fields.activehosted
      };
    });
    
    return emails;
  } catch (error) {
    console.error('Error fetching emails for list:', error);
    return [];
  }
};

// Fetch a single email by ID
export const fetchEmailById = async (emailId: string): Promise<EmailRecord | null> => {
  try {
    // Query the emails table with the specific record ID
    const emailUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_EMAILS_TABLE_ID}/${emailId}`;
    
    console.log('Fetching email with ID:', emailId);
    
    const response = await fetch(emailUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error when fetching email:', errorData);
      throw new Error(`Airtable API error: ${response.status}`);
    }
    
    const record = await response.json();
    
    // Map the Airtable response to our EmailRecord interface
    const email: EmailRecord = {
      id: record.id,
      date: record.fields.date || '',
      date_set: record.fields.date_set || '',
      title: record.fields.title || '',
      campaign_name: record.fields.campaign_name || '',
      id_email: record.fields.id_email,
      status: record.fields.status || 0,
      content: record.fields.content || '',
      list_id: record.fields.list_id,
      activehosted: record.fields.activehosted
    };
    
    return email;
  } catch (error) {
    console.error('Error fetching email by ID:', error);
    return null;
  }
};
