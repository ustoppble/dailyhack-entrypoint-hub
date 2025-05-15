
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { EmailListExtended, Persona } from '@/lib/api/types/marketing';
import { savePersona, fetchPersonas } from '@/lib/api/services/marketing-service';

interface CreatePersonasStepProps {
  importedLists: EmailListExtended[];
  onComplete: (personas: Persona[]) => void;
}

const personaSchema = z.object({
  tag: z.string().min(1, 'ID da lista é obrigatório'),
  activehosted: z.string().min(1, 'Conta ActiveCampaign é obrigatória'),
  avatar: z.string().min(5, 'Nome da persona deve ter pelo menos 5 caracteres'),
  dor_principal: z.string().min(10, 'Descreva a dor principal em pelo menos 10 caracteres'),
  sonho: z.string().min(10, 'Descreva o sonho/objetivo em pelo menos 10 caracteres'),
  duvidas_frequentes: z.string().min(10, 'Inclua dúvidas frequentes com pelo menos 10 caracteres'),
  tom_de_voz_preferido: z.string().min(5, 'Defina o tom de voz em pelo menos 5 caracteres'),
  nivel_de_consciencia: z.string().min(3, 'Informe o nível de consciência'),
  interesse: z.string().min(5, 'Descreva o interesse principal em pelo menos 5 caracteres'),
});

const CreatePersonasStep: React.FC<CreatePersonasStepProps> = ({ importedLists, onComplete }) => {
  const { toast } = useToast();
  const [createdPersonas, setCreatedPersonas] = useState<Persona[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedList, setSelectedList] = useState<EmailListExtended | null>(null);
  
  const form = useForm<z.infer<typeof personaSchema>>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      tag: '',
      activehosted: '',
      avatar: '',
      dor_principal: '',
      sonho: '',
      duvidas_frequentes: '',
      tom_de_voz_preferido: '',
      nivel_de_consciencia: '',
      interesse: '',
    },
  });

  const handleListSelect = (listName: string) => {
    const list = importedLists.find(l => l.name === listName);
    if (list) {
      setSelectedList(list);
      form.setValue('tag', list.name || '');
      form.setValue('activehosted', list.api || '');
    }
  };

  const onSubmit = async (values: z.infer<typeof personaSchema>) => {
    try {
      setIsSaving(true);
      
      // Save persona to Airtable
      const savedPersona = await savePersona(values);
      
      // Add to created personas list
      setCreatedPersonas([...createdPersonas, savedPersona]);
      
      toast({
        title: 'Persona criada',
        description: `Persona "${savedPersona.avatar}" criada com sucesso.`,
      });
      
      // Reset form
      form.reset({
        tag: '',
        activehosted: '',
        avatar: '',
        dor_principal: '',
        sonho: '',
        duvidas_frequentes: '',
        tom_de_voz_preferido: '',
        nivel_de_consciencia: '',
        interesse: '',
      });
      
      setSelectedList(null);
    } catch (err: any) {
      console.error('Error saving persona:', err);
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Não foi possível salvar a persona.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    try {
      // If no personas were created in this session, fetch all personas
      if (createdPersonas.length === 0) {
        const fetchedPersonas = await fetchPersonas();
        onComplete(fetchedPersonas);
      } else {
        onComplete(createdPersonas);
      }
    } catch (err: any) {
      console.error('Error completing personas step:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Ocorreu um erro ao prosseguir para o próximo passo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">2. Criar Personas</h3>
        <p className="text-gray-600">
          Para cada lista importada, crie uma persona que represente seu público-alvo.
        </p>
      </div>
      
      {importedLists.length === 0 ? (
        <div className="p-8 text-center bg-yellow-50 rounded-lg border border-yellow-100">
          <p className="text-amber-800">Nenhuma lista foi importada na etapa anterior.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => onComplete([])}
          >
            Voltar para importar listas
          </Button>
        </div>
      ) : (
        <div>
          {createdPersonas.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2 text-gray-700">Personas já criadas ({createdPersonas.length})</h4>
              <div className="grid gap-2">
                {createdPersonas.map((persona, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md border">
                    <p className="font-medium">{persona.avatar}</p>
                    <p className="text-sm text-gray-500">
                      Lista: {persona.tag} | Conta: {persona.activehosted}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 mb-2">Todas as personas foram criadas?</p>
                <Button onClick={handleComplete}>
                  Prosseguir para o próximo passo
                </Button>
              </div>
              
              <Separator className="my-6" />
            </div>
          )}
          
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Escolha uma lista para criar uma persona</h4>
            <Select onValueChange={handleListSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma lista" />
              </SelectTrigger>
              <SelectContent>
                {importedLists.map((list, index) => (
                  <SelectItem key={index} value={list.name || ''}>
                    {list.name} ({list.api})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedList && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-blue-800 text-sm">
                    Criando persona para: <strong>{selectedList.name}</strong> ({selectedList.api})
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID da Lista</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="activehosted"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta ActiveCampaign</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Persona</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: O Empreendedor Digital Frustrado com Tráfego Pago" />
                      </FormControl>
                      <FormDescription>
                        Um título que descreva bem o seu público
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dor_principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dor Principal</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descreva o problema principal dessa persona" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sonho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sonho/Objetivo</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="O que essa persona deseja alcançar" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duvidas_frequentes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dúvidas Frequentes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Quais perguntas essa persona costuma fazer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tom_de_voz_preferido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tom de Voz Preferido</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Direto e educativo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nivel_de_consciencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Consciência</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="inconsciente">Inconsciente do problema</SelectItem>
                          <SelectItem value="consciente">Consciente do problema</SelectItem>
                          <SelectItem value="solucao">Consciente da solução</SelectItem>
                          <SelectItem value="produto">Consciente do produto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="interesse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interesse Principal</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Marketing digital" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator className="my-6" />
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Criar Persona'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatePersonasStep;
