
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
