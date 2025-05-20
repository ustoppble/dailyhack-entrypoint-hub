
import { airtableIntegrationApi, airtableUpdatesApi } from './client';
import { EmailList } from './types';

export const fetchEmailLists = async (agentName: string): Promise<EmailList[]> => {
  try {
    const response = await airtableIntegrationApi.get('', {
      params: {
        filterByFormula: `{activehosted}="${agentName}"`,
      },
    });
    return response.data.records.map((record: any) => ({
      id: record.id,
      name: record.fields.list_name,
      sender_reminder: record.fields.sender_reminder || '',
      insight: record.fields.insight || '',
      active_subscribers: record.fields.active_subscribers || '0',
    }));
  } catch (error) {
    console.error("Error fetching email lists:", error);
    return [];
  }
};

export const saveSelectedLists = async (userId: string, lists: EmailList[], agentName: string): Promise<boolean> => {
  try {
    // Fetch existing connected lists for the agent and user
    const existingLists = await fetchConnectedLists(agentName, userId);

    // Delete lists that are no longer selected
    for (const existingList of existingLists) {
      if (!lists.some(list => list.id === existingList.list_id)) {
        await deleteConnectedList(existingList.id);
      }
    }

    // Add or update selected lists
    for (const list of lists) {
      const isExisting = existingLists.find(existing => existing.list_id === list.id);
      if (!isExisting && list.id) {
        // Create a new connected list record
        await airtableIntegrationApi.post('', {
          records: [
            {
              fields: {
                list_id: list.id,
                list_name: list.name,
                activehosted: agentName,
                id_user: userId,
              },
            },
          ],
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error saving selected lists:", error);
    return false;
  }
};

export const fetchConnectedLists = async (agentName: string, userId?: string): Promise<any[]> => {
  try {
    let filterFormula = `{activehosted}="${agentName}"`;
    if (userId) {
      filterFormula = `AND(${filterFormula}, {id_user}="${userId}")`;
    }

    const response = await airtableIntegrationApi.get('', {
      params: {
        filterByFormula: filterFormula,
      },
    });

    return response.data.records.map((record: any) => ({
      id: record.id,
      list_id: record.fields.list_id,
      name: record.fields.list_name,
      activehosted: record.fields.activehosted,
      id_user: record.fields.id_user,
    }));
  } catch (error) {
    console.error("Error fetching connected lists:", error);
    return [];
  }
};

export const deleteConnectedList = async (recordId: string): Promise<void> => {
  try {
    await airtableIntegrationApi.delete(`/${recordId}`);
  } catch (error) {
    console.error("Error deleting connected list:", error);
    throw error;
  }
};

// Check if an autopilot already exists for a list and cron ID
export const checkExistingAutopilot = async (
  listId: string | number, 
  cronId: number, 
  agentName: string
): Promise<boolean> => {
  try {
    console.log(`Checking for existing autopilot for list ${listId} with cron ${cronId}`);
    
    const response = await airtableUpdatesApi.get('', {
      params: {
        filterByFormula: `AND({id_list} = '${listId}', {id_cron} = '${cronId}', {url} = '${agentName}')`
      }
    });

    return response.data && response.data.records && response.data.records.length > 0;
  } catch (error) {
    console.error('Error checking existing autopilot:', error);
    // In case of error, assume there might be an existing record to prevent duplicates
    return true;
  }
};
