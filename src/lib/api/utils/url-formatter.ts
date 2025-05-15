
/**
 * Format the ActiveCampaign API URL
 */
export const formatApiUrl = (url: string): string => {
  // Ensure URL has proper format
  let formattedUrl = url.trim();
  
  // Check if URL starts with http/https
  if (!formattedUrl.startsWith('http')) {
    formattedUrl = `https://${formattedUrl}`;
  }
  
  // Clean trailing slashes
  if (formattedUrl.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, -1);
  }
  
  // Convert activehosted.com to api-us1.com format if needed
  if (formattedUrl.includes('activehosted.com')) {
    const accountName = formattedUrl.split('.')[0].split('//')[1];
    formattedUrl = `https://${accountName}.api-us1.com`;
  }
  
  return formattedUrl;
};

/**
 * Extract account name from ActiveCampaign API URL
 * Example: https://gestordenewsletter.api-us1.com -> gestordenewsletter
 */
export const extractAccountName = (url: string): string => {
  // Format the URL first
  const formattedUrl = formatApiUrl(url);
  
  // Extract account name from the URL
  try {
    const urlParts = formattedUrl.split('//');
    if (urlParts.length < 2) return 'unknown';
    
    const domain = urlParts[1].split('.')[0];
    return domain;
  } catch (error) {
    console.error('Error extracting account name:', error);
    return 'unknown';
  }
};
