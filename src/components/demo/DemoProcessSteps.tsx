
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Zap, RotateCcw } from 'lucide-react';

const DemoProcessSteps = () => {
  const steps = [
    {
      number: '1',
      icon: Link,
      title: 'Cole seu conteúdo',
      description: 'Cole seu melhor vídeo/post agora'
    },
    {
      number: '2',
      icon: Zap,
      title: 'IA gera email',
      description: 'IA gera email profissional + dispara automático'
    },
    {
      number: '3',
      icon: RotateCcw,
      title: 'Autopilot ativo',
      description: 'Sistema cria emails novos toda semana'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
        Como funciona
      </h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl font-bold">{step.number}</span>
                </div>
                
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="h-8 w-8 text-gray-600" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DemoProcessSteps;
