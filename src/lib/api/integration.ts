
import axios from 'axios';
import { API_AIRTABLE_INTEGRATION } from './constants';

// API client for integration table
export const airtableIntegrationApi = axios.create({
  baseURL: API_AIRTABLE_INTEGRATION
});

/**
 * Fetch a specific integration by user ID and agent name
 */
export const fetchIntegrationByUserAndAgent = async (userId: string, agentName: string): Promise<{id: string, api: string, token: string, timezone?: string, approver?: number} | null> => {
  try {
    console.log(`Fetching integration for user ${userId} and agent ${agentName}`);
    
    // Filter by both user ID and agent name (API)
    const filterByFormula = encodeURIComponent(`AND({id_users}='${userId}', {api}='${agentName}')`);
    
    const response = await airtableIntegrationApi.get(`?filterByFormula=${filterByFormula}`);
    
    console.log('Specific integration response:', response.data);
    
    if (response.data && response.data.records && response.data.records.length > 0) {
      const record = response.data.records[0];
      return {
        id: record.id,
        api: record.fields.api || agentName,
        token: record.fields.token || '',
        timezone: record.fields.timezone || 'UTC',
        approver: record.fields.approver
      };
    }
    
    return null;
  } catch (error: any) {
    console.error(`Error fetching integration for user ${userId} and agent ${agentName}:`, error);
    throw new Error(`Failed to fetch specific integration: ${error.message}`);
  }
};

/**
 * Verifies if the ActiveCampaign credentials are valid
 */
export const verifyActiveCampaignCredentials = async (apiUrl: string, apiToken: string) => {
  try {
    const formattedUrl = formatApiUrl(apiUrl);
    const testUrl = `${formattedUrl}/api/3/contacts?limit=1`;
    
    const response = await axios.get(testUrl, {
      headers: {
        'Api-Token': apiToken
      }
    });
    
    return { 
      success: true, 
      message: 'Credentials verified successfully' 
    };
  } catch (error: any) {
    console.error('Verification error:', error);
    return { 
      success: false, 
      message: error.response ? `Error ${error.response.status}: ${error.response.statusText}` : error.message,
      isNetworkError: !error.response,
      attemptedUrl: `${formatApiUrl(apiUrl)}/api/3/contacts?limit=1`,
      responseDetails: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : undefined
    };
  }
};

/**
 * Update ActiveCampaign integration settings
 */
export const updateActiveCampaignIntegration = async ({
  userId,
  apiUrl,
  apiToken,
}: {
  userId: string;
  apiUrl: string;
  apiToken: string;
}): Promise<boolean> => {
  try {
    // Extract account name from URL
    const accountName = extractAccountName(apiUrl);
    
    // Prepare the update data
    const updateData = {
      records: [
        {
          id: userId, // Assuming the userId is the Airtable record ID
          fields: {
            api: accountName,
            token: apiToken
          }
        }
      ]
    };
    
    // Make the update request
    await airtableIntegrationApi.patch('', updateData);
    
    return true;
  } catch (error: any) {
    console.error('Error updating integration:', error);
    throw new Error(`Failed to update integration: ${error.message}`);
  }
};

/**
 * Update agent settings including timezone and approver
 */
export const updateAgentSettings = async ({
  integrationId,
  userId,
  apiUrl,
  apiToken,
  timezone,
  approver,
}: {
  integrationId: string;
  userId: string;
  apiUrl: string;
  apiToken: string;
  timezone: string;
  approver: number;
}): Promise<boolean> => {
  try {
    // Extract account name from URL
    const accountName = extractAccountName(apiUrl);
    
    // Prepare the update data
    const updateData = {
      records: [
        {
          id: integrationId,
          fields: {
            api: accountName,
            token: apiToken,
            timezone: timezone,
            approver: approver,
            id_users: userId
          }
        }
      ]
    };
    
    // Make the update request
    await airtableIntegrationApi.patch('', updateData);
    
    return true;
  } catch (error: any) {
    console.error('Error updating agent settings:', error);
    throw new Error(`Failed to update agent settings: ${error.message}`);
  }
};

/**
 * Fetch all integrations for a user
 */
export const fetchUserIntegrations = async (userId: string) => {
  try {
    const filterByFormula = encodeURIComponent(`{id_users}='${userId}'`);
    const response = await airtableIntegrationApi.get(`?filterByFormula=${filterByFormula}`);
    
    if (response.data && response.data.records) {
      return response.data.records.map((record: any) => ({
        id: record.id,
        api: record.fields.api || '',
        token: record.fields.token || '',
        remetente: record.fields.remetente || '',
        email: record.fields.email || '',
        timezone: record.fields.timezone || 'UTC',
        approver: record.fields.approver || 0
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching user integrations:', error);
    throw new Error(`Failed to fetch user integrations: ${error.message}`);
  }
};

/**
 * Helper function to format API URL
 */
export const formatApiUrl = (apiUrl: string): string => {
  if (!apiUrl) return '';
  
  let url = apiUrl.trim();
  
  // If it's just the account name, format it as a proper URL
  if (!url.includes('.') && !url.includes('://')) {
    return `https://${url}.api-us1.com`;
  }
  
  // If it has the domain but not the protocol
  if (!url.startsWith('http')) {
    return `https://${url}`;
  }
  
  return url;
};

/**
 * Helper function to extract account name from API URL
 */
export const extractAccountName = (apiUrl: string): string => {
  if (!apiUrl) return '';
  
  let url = apiUrl.trim();
  
  // If it's already just the account name
  if (!url.includes('.') && !url.includes('://')) {
    return url;
  }
  
  // Remove protocol
  if (url.includes('://')) {
    url = url.split('://')[1];
  }
  
  // Extract the subdomain
  if (url.includes('.api-us1.com')) {
    return url.split('.')[0];
  }
  
  return url;
};
