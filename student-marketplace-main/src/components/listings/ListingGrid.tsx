import React from 'react';
import { Listing } from '../../api/types';
import { ListingCard } from './ListingCard';
import { CardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { PackageOpen } from 'lucide-react';
import { strings } from '../../i18n/strings';

interface ListingGridProps {
  listings: Listing[];
  isLoading?: boolean;
  skeletonCount?: number;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (listing: Listing) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  renderItemActions?: (listing: Listing) => React.ReactNode;
}

export const ListingGrid: React.FC<ListingGridProps> = ({
  listings,
  isLoading = false,
  skeletonCount = 8,
  favoriteIds,
  onToggleFavorite,
  emptyTitle = strings.catalog.noListingsFound,
  emptyDescription = strings.catalog.noListingsDesc,
  emptyActionLabel,
  onEmptyAction,
  renderItemActions,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={<PackageOpen className="w-7 h-7" />}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        className="my-8"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isFavorite={favoriteIds?.has(listing.id)}
          onToggleFavorite={onToggleFavorite}
          showActions={renderItemActions ? renderItemActions(listing) : undefined}
        />
      ))}
    </div>
  );
};
