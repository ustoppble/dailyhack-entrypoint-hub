
import axios from 'axios';
import { airtableIntegrationApi } from './client';
import { ACIntegration, VerificationResult } from './types';

/**
 * Format the ActiveCampaign API URL
 */
export const formatApiUrl = (url: string): string => {
  // Ensure URL has proper format
  let formattedUrl = url.trim();
  
  // Check if URL starts with http/https
  if (!formattedUrl.startsWith('http')) {
    formattedUrl = `https://${formattedUrl}`;
  }
  
  // Clean trailing slashes
  if (formattedUrl.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, -1);
  }
  
  // Convert activehosted.com to api-us1.com format if needed
  if (formattedUrl.includes('activehosted.com')) {
    const accountName = formattedUrl.split('.')[0].split('//')[1];
    formattedUrl = `https://${accountName}.api-us1.com`;
  }
  
  return formattedUrl;
};

/**
 * Extract account name from ActiveCampaign API URL
 * Example: https://gestordenewsletter.api-us1.com -> gestordenewsletter
 */
export const extractAccountName = (url: string): string => {
  // Format the URL first
  const formattedUrl = formatApiUrl(url);
  
  // Extract account name from the URL
  try {
    const urlParts = formattedUrl.split('//');
    if (urlParts.length < 2) return 'unknown';
    
    const domain = urlParts[1].split('.')[0];
    return domain;
  } catch (error) {
    console.error('Error extracting account name:', error);
    return 'unknown';
  }
};

/**
 * N8n webhook URL for ActiveCampaign verification
 */
const N8N_WEBHOOK_URL = 'https://primary-production-2e546.up.railway.app/webhook/d935a725-80e0-405e-8a15-74554dbbc1bd';

/**
 * Verify ActiveCampaign credentials using n8n webhook
 */
export const verifyActiveCampaignCredentials = async (
  apiUrl: string,
  apiToken: string
): Promise<VerificationResult> => {
  try {
    console.log('Verifying ActiveCampaign credentials for URL:', apiUrl);
    console.log('Using n8n webhook for verification');
    
    // Format API URL correctly
    const formattedApiUrl = formatApiUrl(apiUrl);
    
    // Build the webhook URL with query parameters
    const webhookUrlWithParams = `${N8N_WEBHOOK_URL}?url=${encodeURIComponent(formattedApiUrl)}&token=${encodeURIComponent(apiToken)}`;
    
    console.log('Making request to n8n webhook');
    
    try {
      // Make request to n8n webhook
      const response = await axios.get(webhookUrlWithParams, {
        timeout: 15000, // 15 second timeout
      });
      
      console.log('n8n webhook response:', response.data);
      
      // n8n webhook returns "true" if successful, "false" if failed
      const isSuccess = response.data === true || response.data === "true";
      
      if (isSuccess) {
        return {
          success: true,
          message: 'Connection successful',
          attemptedUrl: formattedApiUrl
        };
      } else {
        return {
          success: false,
          message: 'Invalid credentials or connection issue with ActiveCampaign',
          attemptedUrl: formattedApiUrl
        };
      }
    } catch (axiosError: any) {
      console.error('n8n webhook request error:', axiosError);
      
      // More detailed error handling for axios errors
      if (axiosError.response) {
        console.error('Response data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
        
        return { 
          success: false, 
          message: `Error contacting the n8n webhook: ${axiosError.response.status} - ${axiosError.response.data || 'Unknown error'}`,
          attemptedUrl: formattedApiUrl
        };
      } else if (axiosError.request) {
        console.error('No response received:', axiosError.request);
        
        return { 
          success: false,
          isNetworkError: true,
          message: `No response received from n8n webhook. Please check your internet connection.`,
          attemptedUrl: formattedApiUrl
        };
      } else {
        console.error('Error message:', axiosError.message);
        return { 
          success: false, 
          isNetworkError: axiosError.message.includes('network'),
          message: `Error: ${axiosError.message}`,
          attemptedUrl: formattedApiUrl
        };
      }
    }
  } catch (error: any) {
    console.error('ActiveCampaign verification general error:', error);
    return { 
      success: false,
      isNetworkError: error.message?.includes('network'),
      message: error.message || 'An unexpected error occurred during verification.'
    };
  }
};

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
      apiToken: integration.apiToken.substring(0, 5) + '***',
      timezone: integration.timezone,
      approver: integration.approver,
      remetente: integration.remetente,
      email: integration.email
    });
    
    // Extract account name from API URL
    const accountName = extractAccountName(integration.apiUrl);
    console.log('Extracted account name:', accountName);
    
    // Create new record in the integration table with correct field names
    const now = new Date().toISOString();
    
    try {
      // Make sure the user ID is always treated as a string
      // The userId is received as a string from the component
      const response = await airtableIntegrationApi.post('', {
        records: [
          {
            fields: {
              // Provide user ID as a string value as expected by Airtable
              id_users: String(integration.userId), 
              api: accountName,
              token: integration.apiToken,
              timezone: integration.timezone || 'America/New_York',
              approver: integration.approver !== undefined ? Number(integration.approver) : 0,
              remetente: integration.remetente || '',
              email: integration.email || '',
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
 * Now with option to include tokens
 */
export const fetchUserIntegrations = async (userId: string, includeTokens: boolean = false): Promise<{id: string, api: string, token?: string}[]> => {
  try {
    console.log('Fetching integrations for user:', userId);

    // We need to filter by the user ID
    const filterByFormula = encodeURIComponent(`{id_users}='${userId}'`);
    
    const response = await airtableIntegrationApi.get(`?filterByFormula=${filterByFormula}`);
    
    console.log('Integrations response:', response.data);
    
    if (response.data && response.data.records && response.data.records.length > 0) {
      return response.data.records.map((record: any) => ({
        id: record.id,
        api: record.fields.api || 'Unknown Account',
        // Only include the token if requested
        ...(includeTokens && { token: record.fields.token || '' })
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching user integrations:', error);
    throw new Error(`Failed to fetch integrations: ${error.message}`);
  }
};

/**
 * Fetch a specific integration by user ID and agent name
 */
export const fetchIntegrationByUserAndAgent = async (userId: string, agentName: string): Promise<{id: string, api: string, token: string, timezone?: string, approver?: number, remetente?: string, email?: string} | null> => {
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
        timezone: record.fields.timezone || 'America/New_York',
        approver: record.fields.approver !== undefined ? Number(record.fields.approver) : 0,
        remetente: record.fields.remetente || '',
        email: record.fields.email || ''
      };
    }
    
    return null;
  } catch (error: any) {
    console.error(`Error fetching integration for user ${userId} and agent ${agentName}:`, error);
    throw new Error(`Failed to fetch specific integration: ${error.message}`);
  }
};
