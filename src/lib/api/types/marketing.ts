
// Tipos para o módulo de marketing automation

// Lista de email importada do ActiveCampaign
export interface EmailListExtended extends EmailList {
  selected?: boolean;
  id?: string;
  api?: string;
}

// Representa uma persona/avatar
export interface Persona {
  id?: string;
  tag: string;
  activehosted: string;
  avatar: string;
  dor_principal: string;
  sonho: string;
  duvidas_frequentes: string;
  tom_de_voz_preferido: string;
  nivel_de_consciencia: string;
  interesse: string;
  created_at?: string;
}

// Conteúdo importado
export interface ImportedContent {
  videoId: string;
  url: string;
  title: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
  transcription: string;
}

// Email gerado
export interface GeneratedEmail {
  id?: string;
  persona_id: string;
  content_id: string;
  subject: string;
  body: string;
  scheduled_for: string;
  status: 'draft' | 'scheduled' | 'sent';
  created_at?: string;
}
