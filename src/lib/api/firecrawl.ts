
/**
 * Firecrawl API service
 * Handles requests to the Firecrawl webhook
 */

interface FirecrawlResponse {
  success?: boolean;
  offer_name?: string;
  goal?: string;
  message?: string;
  error?: string;
}

/**
 * Fetches data from website using Firecrawl webhook
 * @param link - Website URL to analyze
 * @param style - Content style to analyze for
 */
export async function fetchWebsiteData(link: string, style: string): Promise<FirecrawlResponse> {
  try {
    console.log('Sending request to Firecrawl with:', { link, style });
    
    const response = await fetch('https://primary-production-2e546.up.railway.app/webhook/firecrawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ link, style })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      
      // Return the error details
      return { 
        success: false,
        error: data.message || `Error ${response.status}: The server could not process your request`
      };
    }
    
    return {
      success: true,
      ...data
    };
    
  } catch (error) {
    console.error('Error fetching website data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch website data'
    };
  }
}
