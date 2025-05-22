
/**
 * Test utility for Firecrawl API
 * This file is just for internal testing and debugging
 */

import { fetchWebsiteData } from './firecrawl';

/**
 * Tests the Firecrawl API with a sample response
 */
export async function testFirecrawlWithSampleData() {
  console.log('Testing Firecrawl with sample data...');
  
  const sampleData = [
    {
      output: {
        title: "AI de ActiveCampaign para Aumentar as suas Vendas por Email",
        goal: "Este conteúdo tem como objetivo demonstrar como profissionais e empresas podem aumentar suas taxas de conversão por email com o uso de inteligência artificial integrada ao ActiveCampaign. A estratégia inclui conectar a ferramenta ao ActiveCampaign, disparar campanhas automatizadas via comando de voz no WhatsApp, e criar emails altamente segmentados e personalizados usando tecnologia GPT-4."
      }
    }
  ];
  
  // Call fetchWebsiteData with a dummy URL and style, but pass the sample data
  const result = await fetchWebsiteData('https://example.com', 'softsell', sampleData);
  
  console.log('Test result:', result);
  return result;
}

/**
 * Tests the Firecrawl API with a real API call
 */
export async function testFirecrawlWithRealAPI(url: string, style: string) {
  console.log(`Testing Firecrawl with real API call to ${url} with style ${style}...`);
  
  const result = await fetchWebsiteData(url, style);
  
  console.log('Real API test result:', result);
  return result;
}
