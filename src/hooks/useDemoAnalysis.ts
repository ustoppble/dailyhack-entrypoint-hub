
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useDemoAnalysis = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Accept YouTube, Instagram, and general websites
      const validDomains = [
        'youtube.com',
        'youtu.be',
        'www.youtube.com',
        'instagram.com',
        'www.instagram.com'
      ];
      
      // Check for specific domains or any valid HTTP/HTTPS URL
      return validDomains.some(domain => hostname.includes(domain)) || 
             (urlObj.protocol === 'http:' || urlObj.protocol === 'https:');
    } catch {
      return false;
    }
  };

  const isValid = validateUrl(url);

  const analyzeUrl = async () => {
    if (!isValid) return;
    
    setIsAnalyzing(true);
    
    // Store URL temporarily
    localStorage.setItem('demo_url', url);
    localStorage.setItem('demo_timestamp', Date.now().toString());
    
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      navigate('/demo/analysis');
    }, 2000);
  };

  return {
    url,
    setUrl,
    isValid,
    isAnalyzing,
    analyzeUrl
  };
};
