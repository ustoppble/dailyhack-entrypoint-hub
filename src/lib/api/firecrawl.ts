
/**
 * Firecrawl API service
 * Handles requests to the Firecrawl webhook
 */

// Define response interfaces for better typing
export interface FirecrawlOutput {
  title: string;
  goal: string;
}

export interface FirecrawlResponse {
  success: boolean;
  output?: FirecrawlOutput;
  error?: string;
}

/**
 * Fetches data from website using Firecrawl webhook
 * @param link - Website URL to analyze
 * @param style - Content style to analyze for
 * @param customPayload - Optional custom payload for testing
 * @param useTestData - Force using test data instead of API call
 */
export async function fetchWebsiteData(
  link: string, 
  style: string,
  customPayload?: any, // Allow custom payload for testing purposes
  useTestData: boolean = false // Flag to force test data usage
): Promise<FirecrawlResponse> {
  try {
    console.log('fetchWebsiteData called with:', { link, style, useTestData });
    
    // If test data is requested or custom payload provided, use that instead of making API call
    if (useTestData || customPayload) {
      console.log('Using test data instead of live API');
      
      // Use provided custom payload if available
      if (customPayload) {
        console.log('Using custom payload:', customPayload);
        
        // Process the custom payload to match our expected return format
        if (Array.isArray(customPayload) && customPayload.length > 0) {
          const firstItem = customPayload[0];
          
          if (firstItem && firstItem.output && 
              typeof firstItem.output === 'object' &&
              firstItem.output.title && 
              firstItem.output.goal) {
            
            return {
              success: true,
              output: {
                title: firstItem.output.title,
                goal: firstItem.output.goal
              }
            };
          }
        }
        
        // Return the payload directly if it's already in the expected format
        if (!Array.isArray(customPayload) && 
            customPayload.output && 
            typeof customPayload.output === 'object') {
          return customPayload;
        }
      }
      
      // If no custom payload or it couldn't be processed, return default test data
      return {
        success: true,
        output: {
          title: "AI de ActiveCampaign para Aumentar as suas Vendas por Email",
          goal: "Este conteúdo tem como objetivo demonstrar como profissionais e empresas podem aumentar suas taxas de conversão por email com o uso de inteligência artificial integrada ao ActiveCampaign. A estratégia inclui conectar a ferramenta ao ActiveCampaign, disparar campanhas automatizadas via comando de voz no WhatsApp, e criar emails altamente segmentados e personalizados usando tecnologia GPT-4."
        }
      };
    }
    
    // Proceed with actual API call if test data is not requested
    console.log('Making real API call to Firecrawl webhook');
    
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
        
        // Check for placeholder values
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
