
import { airtableApi } from './client';
import { User } from './types';

/**
 * Check if an email already exists in the database
 */
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

/**
 * Register a new user
 */
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

/**
 * Validate user credentials for login
 */
export const validateUserCredentials = async (email: string, password: string): Promise<User | null> => {
  try {
    console.log('Validating credentials for:', email);
    // Fix: Use proper case for fields in the filterByFormula
    const response = await airtableApi.get('', {
      params: {
        filterByFormula: `AND({email} = "${email}", {password} = "${password}")`,
        maxRecords: 1,
      },
    });

    console.log('Authentication response:', response.data);

    if (response.data.records && response.data.records.length > 0) {
      const record = response.data.records[0];
      console.log('User found:', record.id);
      const user = {
        id: record.id,
        ...record.fields,
      } as User;
      
      // Make sure to capture this in the console for debugging
      console.log('Authenticated user data:', user);
      return user;
    }
    console.log('No user found with those credentials');
    return null;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error('Authentication failed');
  }
};
