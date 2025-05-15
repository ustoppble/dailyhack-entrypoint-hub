
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { EmailListExtended } from '@/lib/api/types/marketing';
import { fetchUserIntegrationInfo, fetchAvailableLists, saveSelectedLists } from '@/lib/api/services/marketing-service';
import LoadingState from '@/components/lists/LoadingState';
import ErrorState from '@/components/lists/ErrorState';

interface ImportListsStepProps {
  onComplete: (selectedLists: EmailListExtended[]) => void;
}

const ImportListsStep: React.FC<ImportListsStepProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableLists, setAvailableLists] = useState<EmailListExtended[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadLists = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch integration details for this user
        const integrations = await fetchUserIntegrationInfo(user.id);
        
        if (integrations.length === 0) {
          setError('No ActiveCampaign integrations found. Please connect an agent first.');
          setIsLoading(false);
          return;
        }
        
        // For each integration, fetch lists
        const allLists: EmailListExtended[] = [];
        
        for (const integration of integrations) {
          try {
            const lists = await fetchAvailableLists(integration.api, integration.token);
            allLists.push(...lists);
          } catch (err) {
            console.error(`Error fetching lists for ${integration.api}:`, err);
            // Continue with next integration if one fails
          }
        }
        
        setAvailableLists(allLists);
        setError(null);
      } catch (err: any) {
        console.error('Error loading lists:', err);
        setError(err.message || 'Failed to load email lists');
        toast({
          title: 'Error',
          description: 'Não foi possível carregar suas listas de email.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLists();
  }, [user, toast]);

  const handleToggleList = (index: number) => {
    const updatedLists = [...availableLists];
    updatedLists[index].selected = !updatedLists[index].selected;
    setAvailableLists(updatedLists);
  };

  const handleSubmit = async () => {
    const selectedLists = availableLists.filter(list => list.selected);
    
    if (selectedLists.length === 0) {
      toast({
        title: 'Seleção necessária',
        description: 'Por favor, selecione pelo menos uma lista para continuar.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Save selected lists to Airtable
      const savedLists = await saveSelectedLists(selectedLists);
      
      toast({
        title: 'Listas importadas',
        description: `${savedLists.length} listas foram importadas com sucesso.`,
      });
      
      onComplete(savedLists);
    } catch (err: any) {
      console.error('Error saving lists:', err);
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Não foi possível salvar as listas selecionadas.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">1. Importar Listas</h3>
        <p className="text-gray-600">
          Selecione as listas de email que deseja importar para o DailyHack.
        </p>
      </div>
      
      {availableLists.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Nenhuma lista encontrada em sua conta ActiveCampaign.</p>
        </div>
      ) : (
        <div>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-2">Total de listas disponíveis: <strong>{availableLists.length}</strong></p>
            <p className="text-sm text-gray-600">Listas selecionadas: <strong>{availableLists.filter(l => l.selected).length}</strong></p>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-3 grid grid-cols-12 gap-2 font-medium text-sm">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Nome</div>
              <div className="col-span-2">Assinantes</div>
              <div className="col-span-4">Insight</div>
              <div className="col-span-1">Selecionar</div>
            </div>
            
            {availableLists.map((list, index) => (
              <div key={`${list.name}-${index}`} className="border-t">
                <div className="p-3 grid grid-cols-12 gap-2 items-center hover:bg-gray-50">
                  <div className="col-span-1 text-gray-500">{index + 1}</div>
                  <div className="col-span-4">
                    <p className="font-medium">{list.name}</p>
                    <p className="text-xs text-gray-500">{list.api}</p>
                  </div>
                  <div className="col-span-2">{list.active_subscribers}</div>
                  <div className="col-span-4 text-sm text-gray-600 truncate" title={list.Insight}>
                    {list.Insight || 'Sem insight disponível'}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Checkbox 
                      checked={list.selected} 
                      onCheckedChange={() => handleToggleList(index)} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Separator className="my-6" />
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={isSaving || availableLists.filter(l => l.selected).length === 0}
            >
              {isSaving ? 'Salvando...' : 'Importar Listas Selecionadas'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportListsStep;
