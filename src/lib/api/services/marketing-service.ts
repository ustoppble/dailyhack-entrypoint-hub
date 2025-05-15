
import axios from 'axios';
import { airtableIntegrationApi } from '../client';
import { EmailListExtended, Persona, ImportedContent, GeneratedEmail } from '../types/marketing';

// URL do webhook para buscar listas
const LISTS_WEBHOOK_URL = 'https://primary-production-2e546.up.railway.app/webhook/listas';

// URL do webhook para processar conteúdo
const CONTENT_WEBHOOK_URL = 'https://primary-production-2e546.up.railway.app/webhook/conteudo';

// IDs das tabelas Airtable
const LISTS_TABLE_ID = 'tblhqy7BdNwj0SPHD';
const PERSONAS_TABLE_ID = 'Table 1';
const EMAILS_TABLE_ID = 'tblWeAwzXeMhK7P6z';

// Cliente Airtable para tabela de listas
export const airtableListsApi = axios.create({
  baseURL: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID || 'appQ1xO0AUpotDePg'}/${LISTS_TABLE_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY || 'patCQxJfk9ad5GpUD.1a42f0b1749856dd9739d9c8042fcd041e101e7f70c2248a857fb2997e2a9c23'}`,
    'Content-Type': 'application/json',
  },
});

// Cliente Airtable para tabela de personas
export const airtablePersonasApi = axios.create({
  baseURL: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID || 'appQ1xO0AUpotDePg'}/${PERSONAS_TABLE_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY || 'patCQxJfk9ad5GpUD.1a42f0b1749856dd9739d9c8042fcd041e101e7f70c2248a857fb2997e2a9c23'}`,
    'Content-Type': 'application/json',
  },
});

// Cliente Airtable para tabela de emails
export const airtableEmailsApi = axios.create({
  baseURL: `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID || 'appQ1xO0AUpotDePg'}/${EMAILS_TABLE_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY || 'patCQxJfk9ad5GpUD.1a42f0b1749856dd9739d9c8042fcd041e101e7f70c2248a857fb2997e2a9c23'}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Busca as informações de integração para um usuário
 */
export const fetchUserIntegrationInfo = async (userId: string): Promise<{api: string, token: string}[]> => {
  try {
    const filterByFormula = encodeURIComponent(`{id_users}='${userId}'`);
    
    const response = await airtableIntegrationApi.get(`?filterByFormula=${filterByFormula}`);
    
    if (response.data && response.data.records && response.data.records.length > 0) {
      return response.data.records.map((record: any) => ({
        api: record.fields.api || '',
        token: record.fields.token || ''
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching user integration info:', error);
    throw new Error(`Failed to fetch integration info: ${error.message}`);
  }
};

/**
 * Busca as listas de email disponíveis para uma integração
 */
export const fetchAvailableLists = async (api: string, token: string): Promise<EmailListExtended[]> => {
  try {
    console.log('Fetching lists for API:', api);
    
    // Build the webhook URL with query parameters
    const webhookUrlWithParams = `${LISTS_WEBHOOK_URL}?api=${encodeURIComponent(api)}&token=${encodeURIComponent(token)}`;
    
    const response = await axios.get(webhookUrlWithParams, {
      timeout: 15000, // 15 second timeout
    });
    
    console.log('Lists webhook response:', response.data);
    
    if (Array.isArray(response.data)) {
      // Map each list and add the API name
      return response.data.map((list: any) => ({
        ...list,
        api: api,
        selected: false
      }));
    }
    
    throw new Error('Invalid response format from lists webhook');
  } catch (error: any) {
    console.error('Error fetching available lists:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      throw new Error(`Error fetching lists: ${error.response.status} - ${error.response.data || 'Unknown error'}`);
    } else if (error.request) {
      throw new Error('No response received from webhook. Check your internet connection.');
    }
    
    throw error;
  }
};

/**
 * Salva as listas selecionadas no Airtable
 */
export const saveSelectedLists = async (lists: EmailListExtended[]): Promise<EmailListExtended[]> => {
  try {
    console.log('Saving selected lists to Airtable:', lists);
    
    const records = lists.map(list => ({
      fields: {
        name: list.name || '',
        description: list.sender_reminder || '',
        insight: list.Insight || '',
        leads: list.active_subscribers || '',
        activehosted: list.api || ''
      }
    }));
    
    const response = await airtableListsApi.post('', {
      records
    });
    
    if (response.data && response.data.records) {
      // Return the saved lists with their IDs
      return response.data.records.map((record: any, index: number) => ({
        ...lists[index],
        id: record.id
      }));
    }
    
    return lists;
  } catch (error: any) {
    console.error('Error saving lists to Airtable:', error);
    throw error;
  }
};

/**
 * Salva uma nova persona no Airtable
 */
export const savePersona = async (persona: Persona): Promise<Persona> => {
  try {
    console.log('Saving persona to Airtable:', persona);
    
    const response = await airtablePersonasApi.post('', {
      records: [
        {
          fields: {
            tag: persona.tag,
            activehosted: persona.activehosted,
            avatar: persona.avatar,
            dor_principal: persona.dor_principal,
            sonho: persona.sonho,
            duvidas_frequentes: persona.duvidas_frequentes,
            tom_de_voz_preferido: persona.tom_de_voz_preferido,
            nivel_de_consciencia: persona.nivel_de_consciencia,
            interesse: persona.interesse,
            created_at: new Date().toISOString()
          }
        }
      ]
    });
    
    if (response.data && response.data.records && response.data.records.length > 0) {
      return {
        ...persona,
        id: response.data.records[0].id,
        created_at: response.data.records[0].fields.created_at
      };
    }
    
    return persona;
  } catch (error: any) {
    console.error('Error saving persona to Airtable:', error);
    throw error;
  }
};

/**
 * Busca todas as personas salvas
 */
export const fetchPersonas = async (): Promise<Persona[]> => {
  try {
    const response = await airtablePersonasApi.get('');
    
    if (response.data && response.data.records) {
      return response.data.records.map((record: any) => ({
        id: record.id,
        tag: record.fields.tag || '',
        activehosted: record.fields.activehosted || '',
        avatar: record.fields.avatar || '',
        dor_principal: record.fields.dor_principal || '',
        sonho: record.fields.sonho || '',
        duvidas_frequentes: record.fields.duvidas_frequentes || '',
        tom_de_voz_preferido: record.fields.tom_de_voz_preferido || '',
        nivel_de_consciencia: record.fields.nivel_de_consciencia || '',
        interesse: record.fields.interesse || '',
        created_at: record.fields.created_at
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching personas from Airtable:', error);
    throw error;
  }
};

/**
 * Importa conteúdo do YouTube
 */
export const importYouTubeContent = async (youtubeUrl: string): Promise<ImportedContent> => {
  try {
    const encodedUrl = encodeURIComponent(youtubeUrl);
    const webhookUrl = `${CONTENT_WEBHOOK_URL}?url=${encodedUrl}`;
    
    const response = await axios.get(webhookUrl, {
      timeout: 30000 // 30 second timeout for content processing
    });
    
    if (response.data && response.data.videoId) {
      return response.data;
    }
    
    throw new Error('Invalid response format from content webhook');
  } catch (error: any) {
    console.error('Error importing YouTube content:', error);
    
    if (error.response) {
      throw new Error(`Error importing content: ${error.response.status} - ${error.response.data || 'Unknown error'}`);
    } else if (error.request) {
      throw new Error('No response received from webhook. Check your internet connection.');
    }
    
    throw error;
  }
};

/**
 * Salva um email gerado no Airtable
 */
export const saveGeneratedEmail = async (email: GeneratedEmail): Promise<GeneratedEmail> => {
  try {
    const response = await airtableEmailsApi.post('', {
      records: [
        {
          fields: {
            persona_id: email.persona_id,
            content_id: email.content_id,
            subject: email.subject,
            body: email.body,
            scheduled_for: email.scheduled_for,
            status: email.status,
            created_at: new Date().toISOString()
          }
        }
      ]
    });
    
    if (response.data && response.data.records && response.data.records.length > 0) {
      return {
        ...email,
        id: response.data.records[0].id,
        created_at: response.data.records[0].fields.created_at
      };
    }
    
    return email;
  } catch (error: any) {
    console.error('Error saving generated email to Airtable:', error);
    throw error;
  }
};

/**
 * Busca emails gerados
 */
export const fetchGeneratedEmails = async (): Promise<GeneratedEmail[]> => {
  try {
    const response = await airtableEmailsApi.get('');
    
    if (response.data && response.data.records) {
      return response.data.records.map((record: any) => ({
        id: record.id,
        persona_id: record.fields.persona_id,
        content_id: record.fields.content_id,
        subject: record.fields.subject,
        body: record.fields.body,
        scheduled_for: record.fields.scheduled_for,
        status: record.fields.status,
        created_at: record.fields.created_at
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching emails from Airtable:', error);
    throw error;
  }
};
