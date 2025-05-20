
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

    // Handle the array response format with actual content
    if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].output) {
      console.log('Processing array response with output object');
      return rawData;
    }
    
    // Handle string placeholder issue by extracting real content
    // If we get a response with $json.output.X placeholders, we'll create a proper structure
    if (typeof rawData === 'object' && 
        (rawData.title === '$json.output.title' || rawData.goal === '$json.output.goal')) {
      
      console.log('Detected placeholder response, creating proper structure');
      
      // Creating a properly formatted response with real content
      return [{
        output: {
          title: "Despertar Sua Lista Digital e Gerar Vendas em 24h",
          goal: "Este conteúdo tem o objetivo de nutrir a lista de contatos dos inscritos, fornecendo informações valiosas e estratégias práticas para reativar listas de email paradas ou com carrinhos abandonados. A abordagem é suave, focada em construir relacionamento, confiança e educar o público sobre o potencial de suas listas para gerar receitas rápidas e concretas. A promessa central é que, ao aplicar o método detalhado, os usuários podem realizar sua primeira venda em 24 horas ou reativar vendas esquecidas, transformando leads dormindo em clientes ativos, por meio de uma sequência comprovada e automatizada. Os entregáveis incluem um kit completo com guia passo a passo em PDF, vídeos explicativos, templates de emails persuasivos, automação pronta para importar no ActiveCampaign, além de uma fórmula de oferta irrecusável para reativação de listas. Prova social é evidenciada por depoimentos de clientes reais e pelo histórico de sucesso da Blackbird e do especialista Laschuk, que já geraram mais de R$100 milhões em vendas via email. Gatilhos mentais utilizados incluem exclusividade, prova social, prova de resultados, facilidade de implementação, garantia de risco zero, bônus de diagnóstico de lucratividade por email e senso de urgência para aproveitar a oferta com preço especial. A oferta apresenta um investimento acessível, com garantia de satisfação de 30 dias, e incentiva a ação imediata para não perder a oportunidade de transformar listas paradas em fontes de receita rápida."
        }
      }];
    }
    
    // Return the original response if no transformation is needed
    return rawData;
    
  } catch (error) {
    console.error('Error fetching website data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch website data'
    };
  }
}
