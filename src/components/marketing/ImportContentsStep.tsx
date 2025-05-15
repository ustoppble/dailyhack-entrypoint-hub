
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ImportedContent } from '@/lib/api/types/marketing';
import { importYouTubeContent } from '@/lib/api/services/marketing-service';

interface ImportContentsStepProps {
  onComplete: (content: ImportedContent) => void;
}

const youtubeSchema = z.object({
  url: z.string()
    .min(1, 'URL é obrigatória')
    .url('Por favor, insira uma URL válida')
    .refine((url) => url.includes('youtube.com') || url.includes('youtu.be'), {
      message: 'A URL deve ser do YouTube',
    }),
});

const ImportContentsStep: React.FC<ImportContentsStepProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<ImportedContent | null>(null);
  
  const form = useForm<z.infer<typeof youtubeSchema>>({
    resolver: zodResolver(youtubeSchema),
    defaultValues: {
      url: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof youtubeSchema>) => {
    try {
      setIsLoading(true);
      
      // Show a toast to let the user know this might take a while
      toast({
        title: 'Processando vídeo',
        description: 'Isso pode levar alguns segundos...',
      });
      
      // Import YouTube content
      const importedContent = await importYouTubeContent(values.url);
      
      setContent(importedContent);
      
      toast({
        title: 'Conteúdo importado',
        description: 'O vídeo foi processado com sucesso.',
      });
    } catch (err: any) {
      console.error('Error importing content:', err);
      toast({
        title: 'Erro ao importar',
        description: err.message || 'Não foi possível processar o vídeo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (content) {
      onComplete(content);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">3. Importar Conteúdos</h3>
        <p className="text-gray-600">
          Importe conteúdo de um vídeo do YouTube para usar na geração de emails.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL do YouTube</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Cole o link de um vídeo do YouTube para importar seu conteúdo
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Importando...' : 'Importar Conteúdo'}
          </Button>
        </form>
      </Form>
      
      {content && (
        <>
          <Separator className="my-6" />
          
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="font-medium text-lg mb-1">{content.title}</h3>
                <p className="text-sm text-gray-500">Canal: {content.channelTitle}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-sm whitespace-pre-line">{content.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Transcrição</h4>
                <div className="max-h-60 overflow-y-auto bg-gray-50 p-4 rounded-md">
                  <p className="text-sm whitespace-pre-line">{content.transcription}</p>
                </div>
              </div>
              
              <Button className="mt-6" onClick={handleContinue}>
                Usar este conteúdo
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ImportContentsStep;
