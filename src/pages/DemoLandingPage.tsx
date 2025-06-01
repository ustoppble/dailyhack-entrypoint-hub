
import React from 'react';
import DemoHeader from '@/components/demo/DemoHeader';
import DemoHeroSection from '@/components/demo/DemoHeroSection';
import DemoUrlInput from '@/components/demo/DemoUrlInput';
import DemoProcessSteps from '@/components/demo/DemoProcessSteps';

const DemoLandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <DemoHeader />
      
      <main className="container mx-auto px-4 py-16">
        <DemoHeroSection />
        <DemoUrlInput />
        <DemoProcessSteps />
      </main>
      
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300">
            &copy; {new Date().getFullYear()} DailyHack. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DemoLandingPage;
