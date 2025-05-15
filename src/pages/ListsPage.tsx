
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmailListCard from '@/components/lists/EmailListCard';
import { fetchEmailLists, saveSelectedLists } from '@/lib/api/lists';
import { EmailList } from '@/lib/api/types';

const ListsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  // Get API URL and token from localStorage (saved during integration step)
  const apiUrl = localStorage.getItem('ac_api_url') || '';
  const apiToken = localStorage.getItem('ac_api_token') || '';
  
  useEffect(() => {
    const loadEmailLists = async () => {
      if (!user) {
        navigate('/integrate');
        return;
      }
      
      if (!apiUrl || !apiToken) {
        setError('Credenciais do ActiveCampaign não encontradas. Por favor, conecte sua conta novamente.');
        setIsLoading(false);
        return;
      }
      
      try {
        const lists = await fetchEmailLists(apiUrl, apiToken);
        setEmailLists(lists);
      } catch (error: any) {
        console.error('Error loading email lists:', error);
        setError(error.message || 'Falha ao carregar listas de email');
        toast({
          title: 'Erro ao carregar listas',
          description: error.message || 'Não foi possível carregar suas listas de email.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEmailLists();
  }, [user, navigate, apiUrl, apiToken, toast]);
  
  const handleListSelect = (listName: string, isSelected: boolean) => {
    const newSelected = new Set(selectedLists);
    
    if (isSelected) {
      newSelected.add(listName);
    } else {
      newSelected.delete(listName);
    }
    
    setSelectedLists(newSelected);
  };
  
  const handleContinue = async () => {
    if (!user || !user.id) {
      toast({
        title: 'Autenticação necessária',
        description: 'Por favor, faça login para continuar.',
        variant: 'destructive',
      });
      navigate('/integrate');
      return;
    }
    
    if (selectedLists.size === 0) {
      toast({
        title: 'Nenhuma lista selecionada',
        description: 'Por favor, selecione pelo menos uma lista para continuar.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Store the list names in localStorage for later use
      localStorage.setItem('selected_lists', JSON.stringify(Array.from(selectedLists)));
      
      await saveSelectedLists(user.id, Array.from(selectedLists));
      
      toast({
        title: 'Listas salvas com sucesso!',
        description: `Você selecionou ${selectedLists.size} lista(s) para trabalhar.`,
      });
      
      // Navigate to the next step
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving selected lists:', error);
      toast({
        title: 'Erro ao salvar listas',
        description: error.message || 'Não foi possível salvar suas listas selecionadas.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Suas Listas do ActiveCampaign</CardTitle>
            <CardDescription className="text-center">
              Selecione as listas que você deseja trabalhar com a DailyHack
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-600">Carregando suas listas de email...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => navigate('/integrate')}
                >
                  Voltar para Integração
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    <Mail className="inline-block mr-2 h-4 w-4" />
                    {emailLists.length} lista(s) encontrada(s)
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    <CheckCircle className="inline-block mr-2 h-4 w-4" />
                    {selectedLists.size} selecionada(s)
                  </p>
                </div>
                
                {emailLists.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Nenhuma lista de email encontrada em sua conta.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Por favor, crie uma lista no ActiveCampaign antes de continuar.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={() => window.open('https://www.activecampaign.com/login', '_blank')}
                    >
                      Abrir ActiveCampaign
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {emailLists.map((list) => (
                      <EmailListCard
                        key={list.name}
                        list={list}
                        selected={selectedLists.has(list.name)}
                        onSelect={handleListSelect}
                      />
                    ))}
                  </div>
                )}
                
                <Separator className="my-8" />
                
                <div className="flex justify-end gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/integrate')}
                  >
                    Voltar
                  </Button>
                  
                  <Button 
                    onClick={handleContinue} 
                    disabled={isSubmitting || selectedLists.size === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Continuar"
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListsPage;
