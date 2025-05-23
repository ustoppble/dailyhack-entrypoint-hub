
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { BadgeDollarSign, BarChart2, BrainCircuit, Globe, Layers, Mail, MessageSquare, Rocket, Target, Zap } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-blue-700 mb-6">DailyHack</h1>
          <p className="text-2xl text-gray-700 mb-8">
            Automatize seu marketing e aumente seus resultados com inteligência artificial
          </p>
          <p className="text-lg text-gray-600 mb-12">
            Conecte com o ActiveCampaign e transforme seu marketing digital com soluções avançadas de automação e análise.
          </p>
          
          {!isAuthenticated ? (
            <div className="grid gap-8 md:grid-cols-2 mt-12">
              <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-700">Novo na DailyHack?</CardTitle>
                  <CardDescription className="text-base">Crie sua conta e comece agora.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Registre-se gratuitamente e conecte sua conta do ActiveCampaign para acessar
                    ferramentas poderosas de automação de marketing.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link to="/register">Registrar Agora</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all shadow-md">
                <CardHeader>
                  <CardTitle>Já registrado?</CardTitle>
                  <CardDescription className="text-base">Acesse sua conta.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Se você já tem uma conta, faça login para acessar seu painel
                    e ferramentas de marketing.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <Link to="/login">Entrar</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-700">Bem-vindo de volta, {user?.name}!</CardTitle>
                <CardDescription className="text-base">Sua conta DailyHack está pronta.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Continue configurando sua integração ou acesse seus agentes.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/integrate">Integrar ActiveCampaign</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/agents">Ver Agentes</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-16">Principais Benefícios</h2>
          
          <div className="grid gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center px-6 text-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <Rocket size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Automação de Marketing</h3>
              <p className="text-gray-600">
                Crie fluxos de marketing automatizados que geram resultados mesmo enquanto você dorme.
              </p>
            </div>
            
            <div className="flex flex-col items-center px-6 text-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <BrainCircuit size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Inteligência Artificial</h3>
              <p className="text-gray-600">
                Aproveite o poder da IA para criar conteúdos personalizados e otimizados para conversão.
              </p>
            </div>
            
            <div className="flex flex-col items-center px-6 text-center">
              <div className="bg-purple-100 p-4 rounded-full mb-4">
                <Mail size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Email Marketing Inteligente</h3>
              <p className="text-gray-600">
                Crie campanhas de email personalizadas que engajam seus clientes e aumentam as taxas de abertura.
              </p>
            </div>
            
            <div className="flex flex-col items-center px-6 text-center">
              <div className="bg-amber-100 p-4 rounded-full mb-4">
                <Target size={32} className="text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Segmentação Avançada</h3>
              <p className="text-gray-600">
                Segmente sua base de contatos com precisão para enviar mensagens relevantes e aumentar a conversão.
              </p>
            </div>
            
            <div className="flex flex-col items-center px-6 text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <BarChart2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Análise de Resultados</h3>
              <p className="text-gray-600">
                Acompanhe métricas detalhadas para otimizar suas campanhas e maximizar seu ROI.
              </p>
            </div>
            
            <div className="flex flex-col items-center px-6 text-center">
              <div className="bg-indigo-100 p-4 rounded-full mb-4">
                <Layers size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Integração Perfeita</h3>
              <p className="text-gray-600">
                Conecte sua conta do ActiveCampaign em minutos e tenha acesso imediato a todos os recursos.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-24 mb-10 bg-blue-50 rounded-xl p-10 text-center">
          <h2 className="text-3xl font-bold text-blue-700 mb-6">Impulsione Seu Negócio Hoje</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já estão usando o DailyHack para transformar seu marketing digital.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/register">Começar Gratuitamente</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Fazer Login</Link>
            </Button>
          </div>
        </div>
        
        <div className="mt-16 grid gap-6 md:grid-cols-3 text-center">
          <div className="flex flex-col items-center">
            <BadgeDollarSign className="h-10 w-10 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Aumente o ROI</h3>
            <p className="text-gray-600">
              Maximize seu retorno sobre investimento com campanhas altamente eficazes.
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <Zap className="h-10 w-10 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Agilidade nas Operações</h3>
            <p className="text-gray-600">
              Economize tempo e recursos com processos automatizados e inteligentes.
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <MessageSquare className="h-10 w-10 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Atendimento Personalizado</h3>
            <p className="text-gray-600">
              Conte com nossa equipe para ajudá-lo a aproveitar ao máximo o sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
