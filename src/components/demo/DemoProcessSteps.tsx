
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Zap, RotateCcw } from 'lucide-react';

const DemoProcessSteps = () => {
  const steps = [
    {
      icon: Link,
      title: '1. Cole seu melhor vídeo/post agora',
      description: 'YouTube, Instagram, LinkedIn ou qualquer conteúdo que já funcionou para você'
    },
    {
      icon: Zap,
      title: '2. IA gera email profissional + dispara automático',
      description: 'Sistema analisa seu conteúdo e cria emails persuasivos que convertem'
    },
    {
      icon: RotateCcw,
      title: '3. Sistema cria emails novos toda semana',
      description: 'Autopilot funciona 24/7, criando novos emails baseados no seu estilo'
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
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="h-8 w-8 text-white" />
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
