
/**
 * Test utility for Firecrawl API
 * This file is for internal testing and debugging
 */

import { fetchWebsiteData } from './firecrawl';

/**
 * Sample data for testing Firecrawl
 */
const SAMPLE_DATA = [
  {
    output: {
      title: "AI de ActiveCampaign para Aumentar as suas Vendas por Email",
      goal: "Este conteúdo tem como objetivo demonstrar como profissionais e empresas podem aumentar suas taxas de conversão por email com o uso de inteligência artificial integrada ao ActiveCampaign. A estratégia inclui conectar a ferramenta ao ActiveCampaign, disparar campanhas automatizadas via comando de voz no WhatsApp, e criar emails altamente segmentados e personalizados usando tecnologia GPT-4."
    }
  }
];

/**
 * Tests the Firecrawl API with a sample response
 * Returns the sample data directly for easier usage in components
 */
export async function testFirecrawlWithSampleData() {
  console.log('Testing Firecrawl with sample data...');
  
  try {
    // Call fetchWebsiteData with dummy URL and style, but force test data usage
    await fetchWebsiteData('https://example.com', 'softsell', SAMPLE_DATA, true);
    
    // Return the sample data directly for components to use
    return SAMPLE_DATA;
  } catch (error) {
    console.error('Error in test function:', error);
    return null;
  }
}

/**
 * Tests the Firecrawl API with a real API call
 */
export async function testFirecrawlWithRealAPI(url: string, style: string) {
  console.log(`Testing Firecrawl with real API call to ${url} with style ${style}...`);
  
  try {
    const result = await fetchWebsiteData(url, style);
    
    console.log('Real API test result:', result);
    return result;
  } catch (error) {
    console.error('Error in real API test:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Creates a FirecrawlTester component for the app
 * This is just a stub - you would implement the component in a separate file
 */
export function createFirecrawlTester() {
  console.log('Creating Firecrawl tester component...');
  
  return {
    name: 'FirecrawlTester',
    description: 'A component to test Firecrawl API with different URLs and styles'
  };
}
