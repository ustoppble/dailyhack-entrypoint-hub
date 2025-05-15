
import axios from 'axios';

const AIRTABLE_API_KEY = 'patCQxJfk9ad5GpUD.1a42f0b1749856dd9739d9c8042fcd041e101e7f70c2248a857fb2997e2a9c23';
const AIRTABLE_BASE_ID = 'appQ1xO0AUpotDePg';
const AIRTABLE_TABLE_ID = 'tblRaSVdNM7os0CHe';

const airtableApi = axios.create({
  baseURL: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
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
  userId: string;
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
    const response = await airtableApi.get('', {
      params: {
        filterByFormula: `AND({email} = "${email}", {password} = "${password}")`,
        maxRecords: 1,
      },
    });

    if (response.data.records && response.data.records.length > 0) {
      const record = response.data.records[0];
      return {
        id: record.id,
        ...record.fields,
      } as User;
    }
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
    // Test API connection
    const response = await axios.get(`${apiUrl}/api/3/users`, {
      headers: {
        'Api-Token': apiToken,
      },
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('ActiveCampaign verification error:', error);
    return false;
  }
};

export const updateActiveCampaignIntegration = async (
  integration: ACIntegration
): Promise<boolean> => {
  try {
    // Find the user record
    const response = await airtableApi.get('', {
      params: {
        filterByFormula: `{email} = "${integration.email}"`,
        maxRecords: 1,
      },
    });
    
    if (response.data.records && response.data.records.length > 0) {
      const record = response.data.records[0];
      
      // Extract account name from API URL
      const apiUrlParts = integration.apiUrl.split('//');
      const accountName = apiUrlParts[1].split('.')[0];
      
      // Update the record
      await airtableApi.patch('', {
        records: [
          {
            id: record.id,
            fields: {
              api: accountName,
              token: integration.apiToken,
              AnalyticsSetup: "Todo"
            },
          },
        ],
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Integration update error:', error);
    throw error;
  }
};
