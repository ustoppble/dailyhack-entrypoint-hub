
import React from 'react';
import { Info } from 'lucide-react';

const FormNotice = () => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4 flex items-start">
      <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-medium mb-1">ActiveCampaign Integration</h4>
        <p className="text-xs opacity-80">
          Connect your ActiveCampaign account to access email lists and automation features.
        </p>
      </div>
    </div>
  );
};

export default FormNotice;
