
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DemoHeader from '@/components/demo/DemoHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react';

interface DemoData {
  url: string;
  platform: string;
  timestamp: number;
}

const DemoAnalysisPage = () => {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedData = localStorage.getItem('demo_analysis');
    if (savedData) {
      setDemoData(JSON.parse(savedData));
    } else {
      // Se não há dados, redireciona para a demo
      navigate('/demo');
      return;
    }

    // Simula tempo de processamento
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  if (!demoData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <DemoHeader />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <Card className="text-center p-12">
              <CardContent>
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Analisando seu conteúdo...
                </h2>
                <p className="text-gray-600">
                  Nossa IA está estudando seu {demoData.platform.toLowerCase()} para criar emails únicos
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <CardTitle className="text-2xl text-green-700">
                      Análise Concluída!
                    </CardTitle>
                    <p className="text-gray-600">
                      Seu autopilot está pronto para ser criado
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Conteúdo Analisado:</h3>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{demoData.platform}</span>
                    <a 
                      href={demoData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm truncate flex-1"
                    >
                      {demoData.url}
                    </a>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    🎯 Próximos Passos:
                  </h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>✅ Conteúdo analisado e processado</li>
                    <li>✅ Estratégia de email definida</li>
                    <li>⏳ Cadastre-se para ativar seu autopilot</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    size="lg" 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => navigate('/register')}
                  >
                    Criar Conta e Ativar Autopilot
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => navigate('/demo')}
                  >
                    Testar Outro Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default DemoAnalysisPage;
