
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
  return null;
};

export default EmailsList;
