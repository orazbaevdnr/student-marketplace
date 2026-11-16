import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { strings } from '../i18n/strings';
import { ListingGrid } from '../components/listings/ListingGrid';

export const Favorites: React.FC = () => {
  const { favorites, favoriteIds, toggleFavorite, loading } = useFavorites();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto py-2 sm:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {strings.favorites.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {strings.favorites.subtitle}
        </p>
      </div>

      <ListingGrid
        listings={favorites}
        isLoading={loading}
        skeletonCount={4}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        emptyTitle={strings.favorites.emptyTitle}
        emptyDescription={strings.favorites.emptyDesc}
        emptyActionLabel={strings.favorites.browseListings}
        onEmptyAction={() => navigate('/')}
      />
    </div>
  );
};
