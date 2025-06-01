
import { useState } from 'react';

interface DemoAnalysisState {
  status: 'idle' | 'validating' | 'valid' | 'invalid' | 'analyzing' | 'success' | 'error';
  url: string;
  error: string;
  isLoading: boolean;
}

export const useDemoAnalysis = () => {
  const [state, setState] = useState<DemoAnalysisState>({
    status: 'idle',
    url: '',
    error: '',
    isLoading: false
  });

  const validateUrl = (url: string) => {
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      setState(prev => ({ ...prev, status: 'idle', error: '' }));
      return false;
    }

    // Regex patterns for supported platforms
    const patterns = {
      youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i,
      instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/.+/i,
      linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/.+/i,
      general: /^https?:\/\/.+\..+/i
    };

    const isValid = Object.values(patterns).some(pattern => pattern.test(trimmedUrl));

    if (isValid) {
      setState(prev => ({ ...prev, status: 'valid', error: '', url: trimmedUrl }));
      return true;
    } else {
      setState(prev => ({ ...prev, status: 'invalid', error: 'URL inválida. Use links do YouTube, Instagram, LinkedIn ou blogs.' }));
      return false;
    }
  };

  const analyzeUrl = async (url: string) => {
    if (!validateUrl(url)) return false;

    setState(prev => ({ ...prev, status: 'analyzing', isLoading: true }));

    try {
      // Simulate analysis process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Store demo data temporarily
      const demoData = {
        url,
        timestamp: Date.now(),
        platform: detectPlatform(url)
      };
      
      localStorage.setItem('demo_analysis', JSON.stringify(demoData));
      
      setState(prev => ({ ...prev, status: 'success', isLoading: false }));
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, status: 'error', error: 'Erro ao analisar conteúdo. Tente novamente.', isLoading: false }));
      return false;
    }
  };

  const detectPlatform = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    return 'Website';
  };

  const resetState = () => {
    setState({
      status: 'idle',
      url: '',
      error: '',
      isLoading: false
    });
  };

  return {
    ...state,
    validateUrl,
    analyzeUrl,
    resetState
  };
};
