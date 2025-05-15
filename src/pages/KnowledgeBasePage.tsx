
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  content: z.string().min(10, {
    message: "O texto deve ter pelo menos 10 caracteres",
  }),
});

const KnowledgeBasePage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar conhecimento",
        variant: "destructive",
      });
      return;
    }
    
    if (!agentName) {
      toast({
        title: "Erro",
        description: "Nome do agente não encontrado",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        texto: values.content,
        activehosted: agentName,
        id_users: user.id
      };
      
      console.log('Enviando dados para a API:', payload);
      
      const response = await axios.post(
        'https://primary-production-2e546.up.railway.app/webhook/nutrir-conhecimento',
        payload
      );
      
      console.log('Resposta da API:', response.data);
      
      toast({
        title: "Sucesso!",
        description: "Conhecimento adicionado com sucesso à base.",
      });
      
      // Reset form after successful submission
      form.reset();
      
    } catch (error: any) {
      console.error('Erro ao enviar conhecimento:', error);
      toast({
        title: "Erro ao enviar conhecimento",
        description: error.message || "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-3xl font-bold">Base de Conhecimento</CardTitle>
            <CardDescription>
              Adicione informações para nutrir a base de conhecimento do {agentName}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert className="mb-6">
              <AlertDescription>
                Este texto será processado e adicionado à base de conhecimento do seu agente. Quanto mais detalhado e relevante for o conteúdo, melhor será o desempenho do seu agente.
              </AlertDescription>
            </Alert>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto para base de conhecimento</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Digite aqui o texto que deseja adicionar à base de conhecimento..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8"
                  >
                    {isSubmitting ? (
                      'Enviando...'
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Enviar Conhecimento
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
