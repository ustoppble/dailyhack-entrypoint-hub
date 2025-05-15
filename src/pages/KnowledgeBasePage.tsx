
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { Send, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StatusMessage from '@/components/integration/StatusMessage';

const formSchema = z.object({
  title: z.string().min(3, {
    message: "O título deve ter pelo menos 3 caracteres",
  }),
  content: z.string().min(10, {
    message: "O texto deve ter pelo menos 10 caracteres",
  }),
});

type KnowledgeResponse = Array<{
  metadata: {
    source: string;
    blobType: string;
    loc: {
      lines: {
        from: number;
        to: number;
      };
    };
    resumo: string;
    insight: string;
    categorias: string;
    título_live: string;
  };
  pageContent: string;
}>;

const KnowledgeBasePage = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<KnowledgeResponse | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
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
    setError(null);
    setSuccess(null);
    setResponseData(null);
    
    try {
      const payload = {
        texto: values.content,
        título: values.title,
        activehosted: agentName,
        id_users: user.id
      };
      
      console.log('Enviando dados para a API:', payload);
      
      const response = await axios.post(
        'https://primary-production-2e546.up.railway.app/webhook/nutrir-conhecimento',
        payload
      );
      
      console.log('Resposta da API:', response.data);
      
      setSuccess("Conhecimento adicionado com sucesso à base.");
      setResponseData(response.data);
      
      toast({
        title: "Sucesso!",
        description: "Conhecimento adicionado com sucesso à base.",
      });
      
      // Reset form after successful submission
      form.reset();
      
    } catch (error: any) {
      console.error('Erro ao enviar conhecimento:', error);
      setError(error.message || "Ocorreu um erro ao processar sua solicitação");
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
        <Card className="shadow-md mb-6">
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
            
            <StatusMessage error={error} success={success} />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da base de conhecimento</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite um título para esta base de conhecimento..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
        
        {responseData && responseData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader className="border-b bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-xl font-bold">Conhecimento adicionado com sucesso!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Título</h3>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {responseData[0].metadata.título_live}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Conteúdo</h3>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {responseData[0].pageContent}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Resumo</h3>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {responseData[0].metadata.resumo}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Insight</h3>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {responseData[0].metadata.insight}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Categorias</h3>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {responseData[0].metadata.categorias}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
