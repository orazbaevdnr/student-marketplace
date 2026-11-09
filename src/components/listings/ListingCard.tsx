import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Listing } from '../../api/types';
import { formatPrice, formatDate, getInitials } from '../../utils/format';
import { Badge } from '../ui/Badge';

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
  const coverImage = listing.images && listing.images.length > 0
    ? listing.images[0]
    : `https://picsum.photos/seed/${listing.id}/600/450`;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(listing);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col h-full">
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Link to={`/listing/${listing.id}`} className="block w-full h-full">
          <img
            src={coverImage}
            alt={listing.title}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isSold ? 'grayscale opacity-75' : ''
            }`}
            loading="lazy"
          />
        </Link>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-sm transition-transform active:scale-90 ${
              isFavorite
                ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                : 'bg-white/80 text-slate-600 hover:bg-white hover:text-rose-500'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
            />
          </button>
        )}

        {/* Sold Overlay Badge */}
        {isSold && (
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
            <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
              Sold
            </span>
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <Badge variant="condition" condition={listing.condition} size="sm" />
          <Badge variant="category" category={listing.category} size="sm" className="hidden sm:inline-flex" />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-lg font-bold text-slate-900">
              {formatPrice(listing.price)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {formatDate(listing.createdAt)}
            </span>
          </div>

          <Link to={`/listing/${listing.id}`} className="block group-hover:text-indigo-600 transition-colors">
            <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug">
              {listing.title}
            </h3>
          </Link>
        </div>

        {/* Seller Info / Actions Footer */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 truncate">
            {listing.seller?.avatarUrl ? (
              <img
                src={listing.seller.avatarUrl}
                alt={listing.seller.name}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                {getInitials(listing.seller?.name || 'S')}
              </div>
            )}
            <span className="truncate font-medium text-slate-600">
              {listing.seller?.name || 'Student'}
            </span>
          </div>

          {showActions && (
            <div className="shrink-0 flex items-center gap-1.5">
              {showActions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
