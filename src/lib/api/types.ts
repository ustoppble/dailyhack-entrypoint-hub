
// User model interface
export interface User {
  id?: string;
  name: string;
  email: string;
  password: string;
  telefone: string;
  date_created?: string;
}

// ActiveCampaign integration interface
export interface ACIntegration {
  userId: string;
  apiUrl: string;
  apiToken: string;
  integrationId?: string;  // Added integrationId field to track existing records
  timezone?: string;
  approver?: number;       // 0 = disabled, 1 = enabled
  remetente?: string;      // Campo para o nome do remetente
  email?: string;          // Campo para o email do remetente
}

export interface VerificationResult {
  success: boolean;
  message?: string;
  isNetworkError?: boolean;
  attemptedUrl?: string;
  responseDetails?: {
    status?: number;
    data?: any;
  };
}

// Email list interface
export interface EmailList {
  name: string;
  sender_reminder: string;
  insight: string; // Changed from Insight to insight (lowercase)
  id?: string;
  active_subscribers: string;
  selected?: boolean;
}
