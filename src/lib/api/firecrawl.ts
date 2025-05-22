
/**
 * Firecrawl API service
 * Handles requests to the Firecrawl webhook
 */

interface FirecrawlResponse {
  success?: boolean;
  title?: string;
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
    
    const rawData = await response.json();
    console.log('Firecrawl API raw response:', rawData);
    
    if (!response.ok) {
      console.error('Firecrawl API error:', rawData);
      
      // Return the error details
      return { 
        success: false,
        error: rawData.message || `Error ${response.status}: The server could not process your request`
      };
    }

    // Handle array response format (as shown in the examples)
    if (Array.isArray(rawData) && rawData.length > 0) {
      console.log('Processing array response format');
      
      // The data structure appears to be an array with an object that has an output property
      if (rawData[0].output) {
        console.log('Found output in array response:', rawData[0].output);
        return rawData; // Return the array as is - it already has the correct structure
      }
    }
    
    // Handle placeholder response - this indicates the API returned placeholders
    // instead of actual content
    if (typeof rawData === 'object' && 
        (rawData.title === '$json.output.title' || rawData.goal === '$json.output.goal')) {
      
      console.log('Detected placeholder response from API');
      
      // Return an error indicating that the API returned placeholders
      return { 
        success: false,
        error: "The API returned placeholder values. Please try a different URL or style."
      };
    }
    
    // Return the original response for any other format
    return rawData;
    
  } catch (error) {
    console.error('Error fetching website data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch website data'
    };
  }
}
