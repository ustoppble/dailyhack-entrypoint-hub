
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
  Insight: string;
  active_subscribers: string;
  selected?: boolean;
}

