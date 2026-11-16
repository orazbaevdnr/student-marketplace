import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, Category, Condition, Listing } from '../api';
import { Filters, FilterState } from '../components/listings/Filters';
import { ListingGrid } from '../components/listings/ListingGrid';
import { Button } from '../components/ui/Button';
import { useFavorites } from '../hooks/useFavorites';
import { strings } from '../i18n/strings';
import { useDebounce } from '../hooks/useDebounce';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface CatalogProps {
  searchQuery?: string;
}

export const Catalog: React.FC<CatalogProps> = ({ searchQuery = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { favoriteIds, toggleFavorite } = useFavorites();

  // Local state for listings and pagination
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced query from props or URL
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Read initial filter values from URL params
  const categoryParam = searchParams.get('category') as Category | null;
  const conditionParam = searchParams.get('condition') as Condition | null;
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const sortParam = (searchParams.get('sort') as any) || 'newest';

  const currentFilters: FilterState = {
    category: categoryParam || undefined,
    condition: conditionParam || undefined,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    sort: sortParam,
  };

  // Sync debounced search to URL if needed
  useEffect(() => {
    const currentQ = searchParams.get('q') || '';
    if (debouncedSearch !== currentQ) {
      const nextParams = new URLSearchParams(searchParams);
      if (debouncedSearch) {
        nextParams.set('q', debouncedSearch);
      } else {
        nextParams.delete('q');
      }
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, searchParams, setSearchParams]);

  const fetchListings = useCallback(
    async (pageToLoad: number, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const q = searchParams.get('q') || undefined;
        const res = await api.getListings({
          q,
          category: currentFilters.category,
          condition: currentFilters.condition,
          minPrice: currentFilters.minPrice,
          maxPrice: currentFilters.maxPrice,
          sort: currentFilters.sort,
          page: pageToLoad,
          pageSize: 12,
        });

        if (append) {
          setListings((prev) => [...prev, ...res.items]);
        } else {
          setListings(res.items);
        }
        setTotal(res.total);
        setPage(pageToLoad);
      } catch (err: any) {
        setError(err.message || strings.catalog.fetchError);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchParams, currentFilters.category, currentFilters.condition, currentFilters.minPrice, currentFilters.maxPrice, currentFilters.sort]
  );

  // Refetch on filter / search changes
  useEffect(() => {
    fetchListings(1, false);
  }, [fetchListings]);

  const handleFilterChange = (newFilters: FilterState) => {
    const nextParams = new URLSearchParams(searchParams);

    if (newFilters.category) nextParams.set('category', newFilters.category);
    else nextParams.delete('category');

    if (newFilters.condition) nextParams.set('condition', newFilters.condition);
    else nextParams.delete('condition');

    if (newFilters.minPrice !== undefined && newFilters.minPrice > 0)
      nextParams.set('minPrice', String(newFilters.minPrice));
    else nextParams.delete('minPrice');

    if (newFilters.maxPrice !== undefined)
      nextParams.set('maxPrice', String(newFilters.maxPrice));
    else nextParams.delete('maxPrice');

    if (newFilters.sort && newFilters.sort !== 'newest')
      nextParams.set('sort', newFilters.sort);
    else nextParams.delete('sort');

    setSearchParams(nextParams, { replace: true });
  };

  const handleClearFilters = () => {
    const nextParams = new URLSearchParams();
    // preserve q if present
    const q = searchParams.get('q');
    if (q) nextParams.set('q', q);
    setSearchParams(nextParams, { replace: true });
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && listings.length < total) {
      fetchListings(page + 1, true);
    }
  };

  const hasMore = listings.length < total;

  return (
    <div>
      {/* Search & Filters Bar */}
      <Filters
        filters={currentFilters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        totalResults={total}
      />

      {/* Error state */}
      {error && (
        <div className="my-8 p-6 bg-red-50 rounded-2xl border border-red-200 text-center flex flex-col items-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <h4 className="text-base font-semibold text-red-900 mb-1">{strings.common.error}</h4>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchListings(1, false)}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            {strings.catalog.retry}
          </Button>
        </div>
      )}

      {/* Listing Grid */}
      {!error && (
        <>
          <ListingGrid
            listings={listings}
            isLoading={isLoading}
            skeletonCount={8}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            emptyActionLabel={strings.catalog.clearFilters}
            onEmptyAction={handleClearFilters}
          />

          {/* Load More Button */}
          {!isLoading && hasMore && (
            <div className="mt-10 text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                isLoading={isLoadingMore}
                className="bg-white shadow-xs px-8"
              >
                {strings.catalog.loadMore} ({listings.length} of {total})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
