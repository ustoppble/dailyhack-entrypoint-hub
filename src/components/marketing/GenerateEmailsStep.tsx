
import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Persona, ImportedContent, GeneratedEmail } from '@/lib/api/types/marketing';
import { fetchPersonas, saveGeneratedEmail, fetchGeneratedEmails } from '@/lib/api/services/marketing-service';

interface GenerateEmailsStepProps {
  personas: Persona[];
  content: ImportedContent | null;
  onComplete: () => void;
}

const emailSchema = z.object({
  persona_id: z.string().min(1, 'Selecione uma persona'),
  content_id: z.string().min(1, 'ID do conteúdo é obrigatório'),
  subject: z.string().min(5, 'O assunto deve ter pelo menos 5 caracteres'),
  body: z.string().min(50, 'O corpo do email deve ter pelo menos 50 caracteres'),
  scheduled_for: z.date({ required_error: 'Selecione uma data' }),
});

const GenerateEmailsStep: React.FC<GenerateEmailsStepProps> = ({ personas: initialPersonas, content, onComplete }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [scheduledEmails, setScheduledEmails] = useState<GeneratedEmail[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);
  
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      persona_id: '',
      content_id: content?.videoId || '',
      subject: '',
      body: '',
      scheduled_for: new Date(),
    },
  });

  // Load personas if not provided
  useEffect(() => {
    const loadData = async () => {
      try {
        // If no personas were passed, fetch them
        if (initialPersonas.length === 0) {
          const fetchedPersonas = await fetchPersonas();
          setPersonas(fetchedPersonas);
        }
        
        // Fetch scheduled emails
        const emails = await fetchGeneratedEmails();
        setScheduledEmails(emails);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingEmails(false);
      }
    };
    
    loadData();
  }, [initialPersonas]);

  const handlePersonaChange = (personaId: string) => {
    const persona = personas.find(p => p.id === personaId);
    if (persona) {
      setSelectedPersona(persona);
      
      // Generate email content based on persona and imported content
      if (content) {
        const generatedSubject = `${content.title.substring(0, 50)}...`;
        
        const intro = `Olá,\n\nBaseado no seu interesse em ${persona.interesse}, achei que você gostaria de ver este conteúdo sobre "${content.title}".`;
        
        const personalization = `Como sei que você enfrenta desafios como ${persona.dor_principal} e busca ${persona.sonho}, este conteúdo pode ser muito útil.`;
        
        const mainPoint = `No vídeo, é abordado:\n\n${content.description.substring(0, 200)}...\n\n`;
        
        const call = `Espero que este conteúdo te ajude a resolver suas dúvidas sobre ${persona.duvidas_frequentes.split(',')[0]}.`;
        
        const signature = `\n\nAtenciosamente,\nDailyHack`;
        
        const body = intro + '\n\n' + personalization + '\n\n' + mainPoint + '\n' + call + signature;
        
        form.setValue('subject', generatedSubject);
        form.setValue('body', body);
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof emailSchema>) => {
    try {
      setIsLoading(true);
      
      // Save email to Airtable
      const savedEmail = await saveGeneratedEmail(values);
      
      // Add to scheduled emails list
      setScheduledEmails([...scheduledEmails, savedEmail]);
      
      toast({
        title: 'Email agendado',
        description: `Email "${values.subject}" agendado para ${format(values.scheduled_for, 'dd/MM/yyyy')}.`,
      });
      
      // Reset form
      form.reset({
        persona_id: '',
        content_id: content?.videoId || '',
        subject: '',
        body: '',
        scheduled_for: new Date(),
      });
      
      setSelectedPersona(null);
    } catch (err: any) {
      console.error('Error saving email:', err);
      toast({
        title: 'Erro ao agendar',
        description: err.message || 'Não foi possível agendar o email.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">4. Gerar Emails</h3>
        <p className="text-gray-600">
          Selecione uma persona e gere um email personalizado baseado no conteúdo importado.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-medium mb-4">Criar novo email</h4>
          
          {personas.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-lg text-amber-800">
              Nenhuma persona encontrada. Volte à etapa anterior para criar personas.
            </div>
          ) : !content ? (
            <div className="p-4 bg-yellow-50 rounded-lg text-amber-800">
              Nenhum conteúdo importado. Volte à etapa anterior para importar conteúdo.
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="persona_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Persona</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handlePersonaChange(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma persona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {personas.map((persona) => (
                            <SelectItem key={persona.id} value={persona.id || ''}>
                              {persona.avatar} ({persona.activehosted})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedPersona && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h5 className="font-medium text-sm mb-1">{selectedPersona.avatar}</h5>
                    <p className="text-xs text-gray-600 mb-1">
                      <strong>Interesse:</strong> {selectedPersona.interesse}
                    </p>
                    <p className="text-xs text-gray-600 mb-1">
                      <strong>Dor principal:</strong> {selectedPersona.dor_principal}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Tom de voz:</strong> {selectedPersona.tom_de_voz_preferido}
                    </p>
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="content_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID do Conteúdo</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Digite o assunto do email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corpo do Email</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Digite o conteúdo do email" 
                          className="min-h-[200px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scheduled_for"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Envio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Agendando...' : 'Agendar Email'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
        
        <div>
          <h4 className="font-medium mb-4">Emails Agendados</h4>
          
          {isLoadingEmails ? (
            <div className="text-center p-6">
              <p className="text-gray-500">Carregando...</p>
            </div>
          ) : scheduledEmails.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhum email agendado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledEmails.map((email) => (
                <Card key={email.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{email.subject}</CardTitle>
                      <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {format(new Date(email.scheduled_for), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-2">
                      <strong>Status:</strong> {email.status === 'draft' ? 'Rascunho' : 
                        email.status === 'scheduled' ? 'Agendado' : 'Enviado'}
                    </p>
                    <div className="text-sm line-clamp-3">
                      {email.body}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={onComplete}
              >
                Concluir Fluxo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateEmailsStep;
