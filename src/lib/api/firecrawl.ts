
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
  output?: {
    title?: string;
    goal?: string;
  };
}

/**
 * Fetches data from website using Firecrawl webhook
 * @param link - Website URL to analyze
 * @param style - Content style to analyze for
 */
export async function fetchWebsiteData(link: string, style: string): Promise<any> {
  try {
    console.log('Sending request to Firecrawl with:', { style, link });
    
    const response = await fetch('https://primary-production-2e546.up.railway.app/webhook/firecrawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ style, link })
    });
    
    const data = await response.json();
    console.log('Firecrawl API response:', data);
    
    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      
      // Return the error details
      return { 
        success: false,
        error: data.message || `Error ${response.status}: The server could not process your request`
      };
    }
    
    // Return the raw response - we'll handle parsing in the component
    return data;
    
  } catch (error) {
    console.error('Error fetching website data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch website data'
    };
  }
}
