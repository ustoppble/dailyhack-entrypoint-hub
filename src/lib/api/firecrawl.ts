
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
 * @param customPayload - Optional custom payload for testing
 */
export async function fetchWebsiteData(
  link: string, 
  style: string,
  customPayload?: any // Allow custom payload for testing purposes
): Promise<any> {
  try {
    console.log('Sending request to Firecrawl with:', { style, link });
    
    if (customPayload) {
      console.log('Using custom payload for testing:', customPayload);
      return customPayload; // Return the custom payload directly for testing
    }
    
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
      
      const firstItem = rawData[0];
      
      // Check if the first item has an output property with title and goal
      if (firstItem && firstItem.output && 
          typeof firstItem.output === 'object' && 
          firstItem.output.title && 
          firstItem.output.goal) {
        
        console.log('Found valid output in array response:', firstItem.output);
        
        // Ensure it's not a placeholder
        if (firstItem.output.title === "$json.output.title" || 
            firstItem.output.goal === "$json.output.goal") {
          console.log('Detected placeholder values in output');
          return { 
            success: false,
            error: "The API returned placeholder values. Please check your API configuration."
          };
        }
        
        return {
          success: true,
          output: {
            title: firstItem.output.title,
            goal: firstItem.output.goal
          }
        };
      }
    }
    
    // Handle direct object response with output property
    if (!Array.isArray(rawData) && rawData && typeof rawData === 'object') {
      console.log('Processing object response format');
      
      // Check for direct output property
      if (rawData.output && typeof rawData.output === 'object') {
        console.log('Found output in object response:', rawData.output);
        
        // Check for placeholders in output
        if (rawData.output.title === "$json.output.title" || 
            rawData.output.goal === "$json.output.goal") {
          console.log('Detected placeholder values in output');
          return { 
            success: false,
            error: "The API returned placeholder values. Please check your API configuration."
          };
        }
        
        return {
          success: true,
          output: {
            title: rawData.output.title,
            goal: rawData.output.goal
          }
        };
      }
      
      // Check for direct title and goal properties
      if (rawData.title && rawData.goal) {
        console.log('Found direct title and goal properties:', { title: rawData.title, goal: rawData.goal });
        
        // Check for placeholders in direct properties
        if (rawData.title === "$json.output.title" || rawData.goal === "$json.output.goal") {
          console.log('Detected placeholder values in direct properties');
          return { 
            success: false,
            error: "The API returned placeholder values. Please check your API configuration."
          };
        }
        
        return {
          success: true,
          output: {
            title: rawData.title,
            goal: rawData.goal
          }
        };
      }
    }
    
    // If we reached here, the response doesn't match any expected format
    console.error('Unexpected response format from Firecrawl API:', rawData);
    return { 
      success: false,
      error: "The API returned an unexpected format. Please try a different URL or style."
    };
    
  } catch (error) {
    console.error('Error fetching website data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch website data'
    };
  }
}
