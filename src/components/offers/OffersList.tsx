
import React from 'react';
import { useParams } from 'react-router-dom';
import { CampaignGoal } from '@/lib/api/goals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash, Link as LinkIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_GOALS_TABLE_ID } from '@/lib/api/constants';

interface OffersListProps {
  offers: CampaignGoal[];
  onDelete: (offerId: string) => void;
  onRefresh: () => void;
}

const OffersList = ({ offers, onDelete, onRefresh }: OffersListProps) => {
  const { agentName } = useParams<{ agentName: string }>();
  const [selectedOffer, setSelectedOffer] = React.useState<CampaignGoal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const getStyleBadgeColor = (style: string) => {
    switch (style) {
      case 'hardsell':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'softsell':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'event':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'nutring':
      default:
        return 'bg-green-100 text-green-800 hover:bg-green-200';
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOffer) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_GOALS_TABLE_ID}/${selectedOffer.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete offer: ${response.status}`);
      }

      onDelete(selectedOffer.id);
      setIsDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error deleting offer:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No offers found for this agent.</p>
        <p className="text-gray-500 text-sm">Create your first offer to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {offers.map((offer) => (
        <Card key={offer.id} className="overflow-hidden">
          <CardHeader className="bg-gray-50 pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{offer.offer_name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => window.location.href = `/agents/${agentName}/offers/edit/${offer.id}`}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600"
                    onClick={() => {
                      setSelectedOffer(offer);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">Goal: {offer.goal}</p>
                </div>
                <Badge className={`${getStyleBadgeColor(offer.style)}`}>
                  {offer.style}
                </Badge>
              </div>
              
              {offer.link && (
                <div className="flex items-center text-sm text-blue-600">
                  <LinkIcon className="h-3 w-3 mr-1" />
                  <a href={offer.link} target="_blank" rel="noopener noreferrer" className="truncate">
                    {offer.link}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this offer?</p>
            <p className="text-sm text-gray-500 mt-1">
              This action cannot be undone and will remove the offer from any associated campaigns.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OffersList;
