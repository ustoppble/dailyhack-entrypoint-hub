import { airtableApi, airtableIntegrationApi } from './client';
import { EmailList, Integration } from './types';

// Function to fetch email lists for a specific integration
export const fetchEmailLists = async (integrationId: string): Promise<EmailList[]> => {
  try {
    const response = await airtableIntegrationApi.get(`/${integrationId}`);
    const integration: Integration = response.data.fields;
    const apiUrl = formatApiUrl(integration.api_url);

    // Fetch lists from ActiveCampaign
    const listsResponse = await airtableApi.post(
      `${apiUrl}/api/3/lists`,
      {},
      {
        headers: {
          'Api-Token': integration.api_key,
          'Content-Type': 'application/json',
        },
      }
    );

    const lists = listsResponse.data.lists || [];
    return lists.map((list: any) => ({
      id: list.id,
      name: list.name,
      active_subscribers: list.active_subscribers,
    }));
  } catch (error) {
    console.error('Error fetching email lists:', error);
    throw error;
  }
};

// Function to construct the API URL based on the account name
export const formatApiUrl = (accountName: string): string => {
  const trimmedAccountName = accountName.replace(/\s+/g, '').toLowerCase();
  return `https://${trimmedAccountName}.api-us1.com`;
};

// Function to save selected lists to Airtable
export const saveSelectedLists = async (
  agentName: string,
  selectedLists: { id: string; name: string }[],
  integrationId: string,
  userId: string
): Promise<void> => {
  try {
    // Fetch the integration record to get the Airtable record ID
    const integrationResponse = await airtableIntegrationApi.get(`/${integrationId}`);
    const integrationRecord = integrationResponse.data;
    const airtableRecordId = integrationRecord.id;

    // Prepare updates for the integration record
    const updates = {
      fields: {
        connected: true,
        agent: agentName,
        user_id: userId,
        lists: selectedLists.map((list) => list.name).join(', '),
        list_ids: selectedLists.map((list) => list.id).join(','),
      },
    };

    // Update the integration record in Airtable
    await airtableIntegrationApi.patch(`/${airtableRecordId}`, updates);

    console.log('Selected lists saved successfully.');
  } catch (error) {
    console.error('Error saving selected lists:', error);
    throw error;
  }
};

// Function to fetch connected lists for an agent
export const fetchConnectedLists = async (agentName: string, userId?: string): Promise<any[]> => {
  try {
    // Fetch integrations for the agent
    const response = await airtableIntegrationApi.get('', {
      params: {
        filterByFormula: `AND(connected=TRUE(), agent="${agentName}", user_id="${userId}")`,
      },
    });

    const integrations = response.data.records || [];

    // Extract list information from the integrations
    return integrations.map((integration) => {
      const { lists, list_ids } = integration.fields;
      const listNames = lists ? lists.split(',') : [];
      const listIds = list_ids ? list_ids.split(',') : [];

      // Combine list names and IDs into a single array of connected lists
      return listNames.map((name: string, index: number) => ({
        id: listIds[index] || '', // Use an empty string as a default ID
        name: name.trim(),
        airtableId: integration.id,
        subscribers: integration.fields.subscribers,
      }));
    }).flat(); // Flatten the array of arrays into a single array
  } catch (error) {
    console.error('Error fetching connected lists:', error);
    throw error;
  }
};

// Function to delete a connected list
export const deleteConnectedList = async (airtableRecordId: string): Promise<void> => {
  try {
    // Prepare updates for the integration record
    const updates = {
      fields: {
        connected: false,
        lists: null,
        list_ids: null,
      },
    };

    // Update the integration record in Airtable to disconnect the list
    await airtableIntegrationApi.patch(`/${airtableRecordId}`, updates);

    console.log('Connected list deleted successfully.');
  } catch (error) {
    console.error('Error deleting connected list:', error);
    throw error;
  }
};

// Function to check if an autopilot already exists for a list
export const checkExistingAutopilot = async (listId: number): Promise<boolean> => {
  try {
    const response = await airtableApi.get('', {
      params: {
        filterByFormula: `{list_id} = ${listId}`,
      },
    });

    const records = response.data.records || [];
    return records.length > 0;
  } catch (error) {
    console.error('Error checking existing autopilot:', error);
    return false; // Return false in case of an error
  }
};
