
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDemoAnalysis } from '@/hooks/useDemoAnalysis';
import { useNavigate } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DemoUrlInput = () => {
  const [inputValue, setInputValue] = useState('');
  const { status, error, isLoading, validateUrl, analyzeUrl } = useDemoAnalysis();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    validateUrl(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await analyzeUrl(inputValue);
    if (success) {
      navigate('/demo/analysis');
    }
  };

  const getInputClassName = () => {
    return cn(
      "h-14 text-lg px-4 pr-12",
      {
        'border-green-500 bg-green-50': status === 'valid',
        'border-red-500 bg-red-50': status === 'invalid',
        'border-blue-500': status === 'analyzing'
      }
    );
  };

  const getStatusIcon = () => {
    if (status === 'valid') return <Check className="h-5 w-5 text-green-500" />;
    if (status === 'invalid') return <X className="h-5 w-5 text-red-500" />;
    if (status === 'analyzing') return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto mb-16">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Input
            type="url"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="https://youtube.com/watch?v=... ou cole seu melhor post aqui"
            className={getInputClassName()}
            disabled={isLoading}
          />
          
          {/* Status icon */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        {/* Loading message */}
        {isLoading && (
          <p className="text-blue-600 text-sm text-center flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analisando conteúdo...
          </p>
        )}

        <div className="text-center">
          <Button
            type="submit"
            size="lg"
            disabled={status !== 'valid' || isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              'CRIAR AUTOPILOT GRÁTIS'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DemoUrlInput;
