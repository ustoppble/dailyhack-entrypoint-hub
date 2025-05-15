
import { Loader2 } from 'lucide-react';

const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
      <p className="text-gray-600">Loading your ActiveCampaign accounts...</p>
    </div>
  );
};

export default LoadingState;
