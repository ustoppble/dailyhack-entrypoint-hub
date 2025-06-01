
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
    
    try {
      // Send POST to webhook
      console.log('Sending URL to webhook:', url);
      
      const response = await fetch('https://primary-production-2e546.up.railway.app/webhook-test/75beebe5-d7a5-4fb1-af0b-03cfb015040d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          timestamp: new Date().toISOString(),
          source: 'demo'
        })
      });

      console.log('Webhook response status:', response.status);
      
      // Store URL temporarily
      localStorage.setItem('demo_url', url);
      localStorage.setItem('demo_timestamp', Date.now().toString());
      
      // Navigate to analysis page after webhook call
      setTimeout(() => {
        setIsAnalyzing(false);
        navigate('/demo/analysis');
      }, 2000);
      
    } catch (error) {
      console.error('Error sending to webhook:', error);
      
      // Even if webhook fails, continue with the demo flow
      localStorage.setItem('demo_url', url);
      localStorage.setItem('demo_timestamp', Date.now().toString());
      
      setTimeout(() => {
        setIsAnalyzing(false);
        navigate('/demo/analysis');
      }, 2000);
    }
  };

  return {
    url,
    setUrl,
    isValid,
    isAnalyzing,
    analyzeUrl
  };
};
