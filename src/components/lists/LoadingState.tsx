
import React from 'react';
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  text?: string;
}

const LoadingState = ({ text = "Loading lists..." }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
      <p className="text-gray-500">{text}</p>
    </div>
  );
};

export default LoadingState;
