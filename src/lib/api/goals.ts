
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_GOALS_TABLE_ID } from './constants';

export interface CampaignGoal {
  id: string;
  goal: string;
  link: string;
  style: 'softsell' | 'hardsell' | 'nutring' | 'event';
  activehosted: string;
  offer_name: string;
  id_user?: string;
}

export const fetchCampaignGoals = async (activeHostedAgent: string, userId?: string): Promise<CampaignGoal[]> => {
  try {
    // Create direct API URL with filter for the activehosted value and optionally user ID
    const goalsApiUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_GOALS_TABLE_ID}`;
    
    let filterFormula = `{activehosted} = "${activeHostedAgent}"`;
    if (userId) {
      filterFormula = `AND(${filterFormula}, {id_user} = "${userId}")`;
    }
    
    const encodedFilter = encodeURIComponent(filterFormula);
    const fullUrl = `${goalsApiUrl}?filterByFormula=${encodedFilter}`;
    
    console.log('Fetching campaign goals for:', activeHostedAgent, 'and user:', userId);
    
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
      goal: record.fields.goal || '',
      link: record.fields.link || '',
      style: record.fields.style || 'nutring',
      activehosted: record.fields.activehosted || '',
      offer_name: record.fields.offer_name || '',
      id_user: record.fields.id_user || ''
    }));
    
    return goals;
  } catch (error) {
    console.error('Error fetching campaign goals:', error);
    return [];
  }
};
