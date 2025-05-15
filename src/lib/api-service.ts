import axios from 'axios';

const AIRTABLE_API_KEY = 'patCQxJfk9ad5GpUD.1a42f0b1749856dd9739d9c8042fcd041e101e7f70c2248a857fb2997e2a9c23';
const AIRTABLE_BASE_ID = 'appQ1xO0AUpotDePg';
const AIRTABLE_TABLE_ID = 'tblRaSVdNM7os0CHe';
const AIRTABLE_INTEGRATION_TABLE_ID = 'tblXTMwj5xIBxCIQG'; // New table for integrations

const airtableApi = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

const airtableIntegrationApi = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_INTEGRATION_TABLE_ID}`,
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface User {
  id?: string;
  name: string;
  email: string;
  password: string;
  telefone: string;
  date_created?: string;
}

export interface ACIntegration {
  email: string;
  apiUrl: string;
  apiToken: string;
}

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const response = await airtableApi.get('', {
      params: {
        filterByFormula: `{email} = "${email}"`,
        maxRecords: 1,
        fields: ['email'],
      },
    });
    
    return response.data.records.length > 0;
  } catch (error) {
    console.error('Error checking email:', error);
    throw new Error('Failed to check email');
  }
};

export const registerUser = async (userData: User): Promise<User> => {
  try {
    // Check if email already exists
    const emailExists = await checkEmailExists(userData.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }
    
    // Create new user record
    const now = new Date().toISOString();
    const response = await airtableApi.post('', {
      records: [
        {
          fields: {
            name: userData.name,
            email: userData.email,
            password: userData.password, // In a real app, hash this before storing
            telefone: userData.telefone,
            date_created: now
          },
        },
      ],
    });
    
    if (response.data.records && response.data.records.length > 0) {
      const record = response.data.records[0];
      return {
        id: record.id,
        ...record.fields,
      } as User;
    } else {
      throw new Error('Failed to create user record');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const validateUserCredentials = async (email: string, password: string): Promise<User | null> => {
  try {
    console.log('Validating credentials for:', email);
    const response = await airtableApi.get('', {
      params: {
        filterByFormula: `AND({email} = "${email}", {password} = "${password}")`,
        maxRecords: 1,
      },
    });

    if (response.data.records && response.data.records.length > 0) {
      const record = response.data.records[0];
      console.log('User found:', record.id);
      return {
        id: record.id,
        ...record.fields,
      } as User;
    }
    console.log('No user found with those credentials');
    return null;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Authentication failed');
  }
};

export const verifyActiveCampaignCredentials = async (
  apiUrl: string,
  apiToken: string
): Promise<{ 
  success: boolean; 
  message?: string; 
  isNetworkError?: boolean; 
  attemptedUrl?: string;
  responseDetails?: {
    status?: number;
    data?: any;
  };
}> => {
  try {
    console.log('Verifying ActiveCampaign credentials for URL:', apiUrl);
    
    // Format API URL correctly - endpoint should be /api/3/users
    let baseUrl = apiUrl;
    
    // Clean up URL format if needed
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // If URL contains activehosted.com, convert to api-us1.com format
    if (baseUrl.includes('activehosted.com')) {
      const accountName = baseUrl.split('.')[0].split('//')[1];
      baseUrl = `https://${accountName}.api-us1.com`;
    }
    
    const endpoint = '/api/3/users';  // Alterando o endpoint para o que foi mostrado no exemplo CURL
    const url = `${baseUrl}${endpoint}`;
    
    console.log('Making API request to:', url);
    console.log('Using API token:', apiToken.substring(0, 5) + '...');
    
    try {
      // Try with direct request
      const response = await axios.get(url, {
        headers: {
          'Api-Token': apiToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000, // 15 second timeout
      });
      
      console.log('ActiveCampaign API response status:', response.status);
      console.log('ActiveCampaign API response data:', response.data);
      
      return { 
        success: response.status === 200,
        message: 'Connection successful',
        attemptedUrl: url,
        responseDetails: {
          status: response.status,
          data: response.data
        }
      };
    } catch (axiosError: any) {
      console.error('ActiveCampaign API request error:', axiosError);
      
      // More detailed error handling for axios errors
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', axiosError.response.data);
        console.error('Response status:', axiosError.response.status);
        
        let errorMessage: string;
        
        switch (axiosError.response.status) {
          case 401:
            errorMessage = 'Invalid API token. Please check your credentials.';
            break;
          case 402:
            errorMessage = 'The request could not be processed due to account payment issues.';
            break;
          case 403:
            errorMessage = 'Authentication failed or unauthorized access.';
            break;
          case 404:
            errorMessage = 'API URL is incorrect or endpoint not found.';
            break;
          case 422:
            errorMessage = 'Invalid parameters in the request.';
            break;
          case 429:
            errorMessage = 'Too many requests. Rate limit exceeded.';
            break;
          default:
            errorMessage = `Server error: ${axiosError.response.status} - ${axiosError.response.data?.message || 'Unknown error'}`;
        }
        
        return { 
          success: false, 
          message: errorMessage,
          attemptedUrl: url,
          responseDetails: {
            status: axiosError.response.status,
            data: axiosError.response.data
          }
        };
      } else if (axiosError.request) {
        // The request was made but no response was received
        console.error('No response received:', axiosError.request);
        
        // This is likely a CORS or network connectivity issue
        return { 
          success: false,
          isNetworkError: true,
          message: `Nenhuma resposta recebida do ActiveCampaign. Isso pode ser devido a restrições de CORS ou problemas de rede.`,
          attemptedUrl: url
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', axiosError.message);
        return { 
          success: false, 
          isNetworkError: axiosError.message.includes('network'),
          message: `Error: ${axiosError.message}`,
          attemptedUrl: url
        };
      }
    }
  } catch (error: any) {
    console.error('ActiveCampaign verification general error:', error);
    return { 
      success: false,
      isNetworkError: error.message.includes('network'),
      message: error.message || 'An unexpected error occurred during verification.'
    };
  }
};

export const updateActiveCampaignIntegration = async (
  integration: ACIntegration
): Promise<boolean> => {
  try {
    console.log('Updating integration with:', {
      email: integration.email,
      apiUrl: integration.apiUrl,
      apiToken: integration.apiToken.substring(0, 5) + '***'
    });
    
    // Extract account name from API URL
    const apiUrlParts = integration.apiUrl.split('//');
    const accountName = apiUrlParts[1]?.split('.')[0] || 'unknown';
    console.log('Extracted account name:', accountName);
    
    // Create new record in the integration table
    const now = new Date().toISOString();
    
    try {
      const response = await airtableIntegrationApi.post('', {
        records: [
          {
            fields: {
              email: integration.email,
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
