
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_GOALS_TABLE_ID } from './constants';

export interface CampaignGoal {
  id: string;
  objetivo: string;
  link: string;
  style: 'softsell' | 'hardsell' | 'nutring';
  activehosted: string;
}

export const fetchCampaignGoals = async (activeHostedAgent: string): Promise<CampaignGoal[]> => {
  try {
    // Create direct API URL with filter for the activehosted value
    const goalsApiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_GOALS_TABLE_ID}`;
    const filterFormula = encodeURIComponent(`{activehosted} = "${activeHostedAgent}"`);
    const fullUrl = `${goalsApiUrl}?filterByFormula=${filterFormula}`;
    
    console.log('Fetching campaign goals for:', activeHostedAgent);
    
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error when fetching campaign goals:', errorData);
      throw new Error(`Airtable API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Campaign goals fetched:', data);
    
    // Map the Airtable records to our CampaignGoal interface
    const goals = data.records.map((record: any) => ({
      id: record.id,
      objetivo: record.fields.objetivo || '',
      link: record.fields.link || '',
      style: record.fields.style || 'nutring',
      activehosted: record.fields.activehosted || ''
    }));
    
    return goals;
  } catch (error) {
    console.error('Error fetching campaign goals:', error);
    return [];
  }
};
