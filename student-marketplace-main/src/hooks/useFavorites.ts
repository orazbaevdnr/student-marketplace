import { useState, useEffect, useCallback } from 'react';
import { api, Listing } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ui/Toast';
import { strings } from '../i18n/strings';

export function useFavorites() {
  const { user } = useAuth();
  const toast = useToast();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      setFavorites([]);
      return;
    }
    setLoading(true);
    try {
      const list = await api.getFavorites(user.id);
      setFavorites(list);
      setFavoriteIds(new Set(list.map((l) => l.id)));
    } catch (e) {
      console.error('Failed to fetch favorites', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(
    async (listing: Listing) => {
      if (!user) return;

      const wasFavorite = favoriteIds.has(listing.id);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) {
          next.delete(listing.id);
        } else {
          next.add(listing.id);
        }
        return next;
      });

      setFavorites((prev) => {
        if (wasFavorite) {
          return prev.filter((l) => l.id !== listing.id);
        } else {
          return [listing, ...prev];
        }
      });

      try {
        await api.toggleFavorite(user.id, listing.id);
        if (wasFavorite) {
          toast.info(strings.favorites.removedToast);
        } else {
          toast.success(strings.favorites.addedToast);
        }
      } catch (e) {
        // Rollback on error
        setFavoriteIds((prev) => {
          const rollback = new Set(prev);
          if (wasFavorite) {
            rollback.add(listing.id);
          } else {
            rollback.delete(listing.id);
          }
          return rollback;
        });
        toast.error('Failed to update favorites');
      }
    },
    [user, favoriteIds, toast]
  );

  const isFavorite = useCallback(
    (id: string) => favoriteIds.has(id),
    [favoriteIds]
  );

  return {
    favorites,
    favoriteIds,
    isFavorite,
    toggleFavorite,
    loading,
    refresh: fetchFavorites,
  };
}
