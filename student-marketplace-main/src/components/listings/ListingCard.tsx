import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Listing } from '../../api/types';
import { formatPrice, formatDate, getInitials } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { SafeImage } from '../ui/SafeImage';

interface ListingCardProps {
  listing: Listing;
  isFavorite?: boolean;
  onToggleFavorite?: (listing: Listing) => void;
  showActions?: React.ReactNode;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  isFavorite = false,
  onToggleFavorite,
  showActions,
}) => {
  const isSold = listing.status === 'sold';
  const coverImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(listing);
    }
  };

  return (
    <div className="group relative bg-surface rounded-xl border border-ink-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-ink-300 transition-all duration-200 flex flex-col h-full">
      {/* Photo with the memorable price tag */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-chalk">
        <Link to={`/listing/${listing.id}`} className="block w-full h-full">
          <SafeImage
            src={coverImage}
            alt={listing.title}
            fallbackLabel="No photo"
            iconClassName="w-9 h-9"
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
              isSold ? 'grayscale opacity-75' : ''
            }`}
            loading="lazy"
            decoding="async"
          />
        </Link>

        <span className="price-tag absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] truncate">
          {formatPrice(listing.price)}
        </span>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md shadow-sm transition-all duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cobalt-500 ${
              isFavorite
                ? 'bg-coral-50 text-coral-500 hover:bg-coral-100'
                : 'bg-surface/90 text-ink-600 hover:bg-surface hover:text-coral-500'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-coral-500 text-coral-500' : ''}`}
            />
          </button>
        )}

        {/* Sold Overlay Badge */}
        {isSold && (
          <div className="absolute inset-0 z-[1] bg-ink-950/25 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <span className="bg-ink-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              Sold
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/listing/${listing.id}`} className="block group-hover:text-cobalt-700 transition-colors">
            <h3 className="font-display font-bold text-ink-900 text-base line-clamp-2 leading-snug">
              {listing.title}
            </h3>
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="condition" condition={listing.condition} size="sm" />
            <Badge variant="category" category={listing.category} size="sm" />
          </div>
        </div>

        {/* Seller Info / Actions Footer */}
        <div className="pt-3 mt-3 border-t border-ink-100 flex items-center justify-between gap-2 text-xs text-ink-500">
          <Link
            to={`/seller/${listing.sellerId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 truncate hover:text-cobalt-700 transition-colors min-w-0"
            title="View seller profile & reviews"
          >
            {listing.seller?.avatarUrl ? (
              <img
                src={listing.seller.avatarUrl}
                alt={listing.seller.name}
                className="w-5 h-5 rounded-full object-cover shrink-0"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-cobalt-100 text-cobalt-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                {getInitials(listing.seller?.name || 'S')}
              </div>
            )}
            <span className="truncate font-semibold">
              {listing.seller?.name || 'Student'}
            </span>
          </Link>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] text-ink-400 font-medium">
              {formatDate(listing.createdAt)}
            </span>
            {showActions && (
              <div className="flex items-center gap-1.5">
                {showActions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
