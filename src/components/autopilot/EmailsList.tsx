// This component is no longer needed as we're now using a full page route
// Instead of completely deleting it, I'll leave it empty in case other parts
// of the application still reference it

import React from 'react';

interface EmailsListProps {
  listId: number;
  listName: string;
  onClose: () => void;
}

const EmailsList = ({ listId, listName, onClose }: EmailsListProps) => {
  // This component is deprecated - using ListEmailsPage instead
  // Redirecting to the full page view would be better, but we'll keep it simple for now
  return (
    <div className="p-4 border rounded">
      <p className="text-center">
        This component is deprecated. Please use the full page email list view.
      </p>
      <div className="flex justify-center mt-4">
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EmailsList;
