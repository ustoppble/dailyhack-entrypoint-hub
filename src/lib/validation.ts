
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 6 characters
  return password.length >= 6;
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic validation for WhatsApp - at least 8 digits
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 8;
};

export const formatPhoneNumber = (phone: string): string => {
  // Format as international WhatsApp number
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length <= 2) return digitsOnly;
  if (digitsOnly.length <= 7) return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
  return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7)}`;
};

export const validateActiveCampaignUrl = (url: string): boolean => {
  // More flexible URL validation to accept various ActiveCampaign URL formats
  if (!url) return false;
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Accept common formats
  const validDomains = [
    'api-us1.com',
    'activehosted.com',
    'activecampaign.com'
  ];
  
  // Check for any valid domain
  return validDomains.some(domain => trimmedUrl.includes(domain));
};
