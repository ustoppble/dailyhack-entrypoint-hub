
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
): Promise<boolean> => {
  try {
    console.log('Verifying ActiveCampaign credentials for URL:', apiUrl);
    // Make sure the URL is valid by adding /api/3/users if not already present
    const url = apiUrl.endsWith('/') ? `${apiUrl}api/3/users` : `${apiUrl}/api/3/users`;
    
    console.log('Making API request to:', url);
    const response = await axios.get(url, {
      headers: {
        'Api-Token': apiToken,
      },
    });
    
    console.log('ActiveCampaign API response status:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('ActiveCampaign verification error:', error);
    // More detailed error message
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
    }
    return false;
  }
};

export const updateActiveCampaignIntegration = async (
  integration: ACIntegration
): Promise<boolean> => {
  try {
    console.log('Updating integration with:', integration);
    // Extract account name from API URL
    const apiUrlParts = integration.apiUrl.split('//');
    const accountName = apiUrlParts[1]?.split('.')[0] || 'unknown';
    console.log('Extracted account name:', accountName);
    
    // Create new record in the integration table
    const now = new Date().toISOString();
    const response = await airtableIntegrationApi.post('', {
      records: [
        {
          fields: {
            api: accountName,
            token: integration.apiToken,
            DateCreated: now
          },
        },
      ],
    });
    
    console.log('Integration update response:', response.data);
    return response.data.records && response.data.records.length > 0;
  } catch (error) {
    console.error('Integration update error:', error);
    throw error;
  }
};
