
import { airtableIntegrationApi } from '../client';
import { ACIntegration } from '../types';
import { extractAccountName } from '../utils/url-formatter';

/**
 * Update ActiveCampaign integration details
 */
export const updateActiveCampaignIntegration = async (
  integration: ACIntegration
): Promise<boolean> => {
  try {
    console.log('Updating integration with:', {
      userId: integration.userId,
      apiUrl: integration.apiUrl,
      apiToken: integration.apiToken.substring(0, 5) + '***'
    });
    
    // Extract account name from API URL
    const accountName = extractAccountName(integration.apiUrl);
    console.log('Extracted account name:', accountName);
    
    // Create new record in the integration table with correct field names
    const now = new Date().toISOString();
    
    try {
      // IMPORTANT: For Airtable, we need to format the user ID as a string
      // and NOT as an array. Airtable expects record IDs in a specific format.
      // The integration table likely has a different field structure.
      const response = await airtableIntegrationApi.post('', {
        records: [
          {
            fields: {
              // For Airtable, we provide user ID as a string without array brackets
              // This is what's causing the error - Airtable expects a different format
              id_users: integration.userId, // Provide as a single string value, not an array
              api: accountName,
              token: integration.apiToken,
              DateCreated: now
            },
          },
        ],
      });
      
      console.log('Integration update response:', response.data);
      return response.data.records && response.data.records.length > 0;
    } catch (airtableError: any) {
      console.error('Airtable integration error:', airtableError);
      
      if (airtableError.response) {
        console.error('Airtable error response:', airtableError.response.data);
        
        // More detailed error for field formatting issues
        if (airtableError.response.status === 422) {
          console.error('Airtable field format error details:', airtableError.response.data?.error);
          
          // If we still have format issues, try a different approach - check what Airtable expects
          if (airtableError.response.data?.error?.type === 'INVALID_VALUE_FOR_COLUMN') {
            throw new Error(`Airtable field format error: ${airtableError.response.data?.error?.message}. 
            Try providing the user ID in the format required by your Airtable base.`);
          }
          
          throw new Error(`Airtable field format error: ${airtableError.response.data?.error?.message}`);
        }
        
        throw new Error(`Airtable error: ${airtableError.response.data?.error?.message || 'Unknown database error'}`);
      } else if (airtableError.request) {
        throw new Error('Network error: Could not connect to our database. Please check your internet connection.');
      } else {
        throw airtableError;
      }
    }
  } catch (error: any) {
    console.error('Integration update error:', error);
    throw error;
  }
};

/**
 * Fetch all ActiveCampaign integrations for a specific user
 */
export const fetchUserIntegrations = async (userId: string): Promise<{id: string, api: string}[]> => {
  try {
    console.log('Fetching integrations for user:', userId);

    // We need to filter by the user ID
    const filterByFormula = encodeURIComponent(`{id_users}='${userId}'`);
    
    const response = await airtableIntegrationApi.get(`?filterByFormula=${filterByFormula}`);
    
    console.log('Integrations response:', response.data);
    
    if (response.data && response.data.records && response.data.records.length > 0) {
      return response.data.records.map((record: any) => ({
        id: record.id,
        api: record.fields.api || 'Unknown Account'
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching user integrations:', error);
    throw new Error(`Failed to fetch integrations: ${error.message}`);
  }
};
