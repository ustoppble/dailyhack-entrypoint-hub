
import { airtableApi } from './client';
import { AIRTABLE_BASE_ID, AIRTABLE_API_KEY } from './constants';

// Airtable table ID for the autopilot data
const AIRTABLE_AUTOPILOT_TABLE_ID = 'tblfN4S5R9BNqT5Zk';
// Airtable table ID for the emails data
const AIRTABLE_EMAILS_TABLE_ID = 'tblEmails';

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

// Fetch emails for a specific list
export const fetchEmailsForList = async (listId: number): Promise<EmailRecord[]> => {
  try {
    // This is a placeholder since we don't have the actual emails table
    // In a real implementation, you would query the emails table with the list_id filter
    const emailsApiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_EMAILS_TABLE_ID}`;
    
    // Add list_id filter
    const filterFormula = encodeURIComponent(`{list_id} = ${listId}`);
    const fullUrl = `${emailsApiUrl}?filterByFormula=${filterFormula}`;
    
    console.log('Fetching emails for list ID:', listId);
    
    // Since we don't have an actual emails table yet, return some mock data
    // In a production app, you would make the actual API call here
    const mockEmails: EmailRecord[] = [
      {
        id: 'email1',
        date: '2025-05-19T08:30:00Z',
        title: 'Welcome to our newsletter',
        campaign_name: 'Onboarding Series',
        id_email: 1001,
        status: 1,
        content: '<h1>Welcome!</h1><p>Thank you for subscribing to our newsletter.</p>',
        list_id: listId
      },
      {
        id: 'email2',
        date: '2025-05-20T08:30:00Z',
        title: 'Your first steps',
        campaign_name: 'Onboarding Series',
        id_email: 1002,
        status: 0,
        content: '<h1>Getting Started</h1><p>Here are some tips to get you started.</p>',
        list_id: listId
      }
    ];
    
    return mockEmails;
  } catch (error) {
    console.error('Error fetching emails for list:', error);
    return [];
  }
};

// Fetch a single email by ID
export const fetchEmailById = async (emailId: string): Promise<EmailRecord | null> => {
  try {
    // This is a placeholder since we don't have the actual emails table
    // In a real implementation, you would query the emails table with the email ID
    
    console.log('Fetching email with ID:', emailId);
    
    // Mock data for demonstration
    const mockEmail: EmailRecord = {
      id: emailId,
      date: '2025-05-19T08:30:00Z',
      title: 'Welcome to our newsletter',
      campaign_name: 'Onboarding Series',
      id_email: 1001,
      status: 1,
      content: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              h1 { color: #0066cc; }
              .content { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
              .footer { margin-top: 30px; font-size: 12px; color: #888; text-align: center; }
            </style>
          </head>
          <body>
            <h1>Welcome to Our Newsletter!</h1>
            <div class="content">
              <p>Dear Subscriber,</p>
              <p>Thank you for joining our newsletter. We're excited to have you on board!</p>
              <p>You'll be receiving valuable insights, tips, and updates about our products and services.</p>
              <p>If you have any questions, feel free to reply to this email.</p>
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Our Company. All rights reserved.</p>
              <p>You're receiving this email because you subscribed to our newsletter.</p>
            </div>
          </body>
        </html>
      `,
      list_id: 123
    };
    
    return mockEmail;
  } catch (error) {
    console.error('Error fetching email by ID:', error);
    return null;
  }
};
