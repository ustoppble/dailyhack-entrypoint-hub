import { airtableIntegrationApi, airtableUpdatesApi } from './client';

export interface EmailList {
  id: string;
  name: string;
}

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
    }));
  } catch (error) {
    console.error("Error fetching email lists:", error);
    return [];
  }
};

export const saveSelectedLists = async (agentName: string, listIds: string[], userId: string): Promise<void> => {
  try {
    // Fetch existing connected lists for the agent and user
    const existingLists = await fetchConnectedLists(agentName, userId);

    // Delete lists that are no longer selected
    for (const existingList of existingLists) {
      if (!listIds.includes(existingList.id)) {
        await deleteConnectedList(existingList.id);
      }
    }

    // Add or update selected lists
    for (const listId of listIds) {
      const isExisting = existingLists.find(list => list.id === listId);
      if (!isExisting) {
        // Fetch the list name using the listId
        const listName = await fetchListNameById(listId);
        if (listName) {
          // Create a new connected list record
          await airtableIntegrationApi.post('', {
            records: [
              {
                fields: {
                  list_id: listId,
                  list_name: listName,
                  activehosted: agentName,
                  id_user: userId,
                },
              },
            ],
          });
        } else {
          console.warn(`List name not found for list ID: ${listId}`);
        }
      }
    }
  } catch (error) {
    console.error("Error saving selected lists:", error);
    throw error;
  }
};

// Function to fetch the list name by ID
const fetchListNameById = async (listId: string): Promise<string | null> => {
  try {
    const response = await airtableIntegrationApi.get('', {
      params: {
        filterByFormula: `{list_id}="${listId}"`,
      },
    });

    if (response.data.records && response.data.records.length > 0) {
      return response.data.records[0].fields.list_name || null;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching list name by ID:", error);
    return null;
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
