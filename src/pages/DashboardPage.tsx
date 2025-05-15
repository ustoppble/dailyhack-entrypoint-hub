
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { EmailList } from '@/lib/api/types';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  
  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/integrate');
      return;
    }
    
    // Load selected lists from localStorage
    const storedLists = localStorage.getItem('selected_lists');
    if (storedLists) {
      try {
        setSelectedLists(JSON.parse(storedLists));
      } catch (error) {
        console.error('Error parsing stored lists:', error);
        setSelectedLists([]);
      }
    }
  }, [user, navigate]);
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Dashboard</CardTitle>
            <CardDescription>
              Bem-vindo ao seu dashboard da DailyHack, {user?.name}!
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">Suas listas selecionadas</h2>
            
            {selectedLists.length === 0 ? (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-700">Nenhuma lista selecionada.</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => navigate('/lists')}
                >
                  Selecionar Listas
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium">Você está trabalhando com {selectedLists.length} lista(s):</p>
                  <ul className="list-disc list-inside mt-2">
                    {selectedLists.map((list) => (
                      <li key={list} className="ml-2">{list}</li>
                    ))}
                  </ul>
                </div>
                
                <p className="text-gray-600">
                  Você pode começar a criar campanhas para estas listas ou explorar as análises disponíveis.
                </p>
                
                <div className="flex gap-4 mt-6">
                  <Button>Criar Campanha</Button>
                  <Button variant="outline" onClick={() => navigate('/lists')}>
                    Gerenciar Listas
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
