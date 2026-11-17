import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, X, ArrowUpDown, Check } from 'lucide-react';
import { Category, Condition } from '../../api/types';
import { strings } from '../../i18n/strings';
import { Button } from '../ui/Button';

export interface FilterState {
  category?: Category;
  condition?: Condition;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClear: () => void;
  totalResults?: number;
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'textbooks', label: strings.catalog.categories.textbooks },
  { key: 'electronics', label: strings.catalog.categories.electronics },
  { key: 'furniture', label: strings.catalog.categories.furniture },
  { key: 'clothes', label: strings.catalog.categories.clothes },
  { key: 'dorm_home', label: strings.catalog.categories.dorm_home },
  { key: 'sports', label: strings.catalog.categories.sports },
  { key: 'other', label: strings.catalog.categories.other },
];

const CONDITIONS: { key: Condition; label: string }[] = [
  { key: 'new', label: strings.catalog.conditions.new },
  { key: 'like_new', label: strings.catalog.conditions.like_new },
  { key: 'good', label: strings.catalog.conditions.good },
  { key: 'fair', label: strings.catalog.conditions.fair },
];

interface ActiveChip {
  key: 'category' | 'condition' | 'minPrice' | 'maxPrice';
  label: string;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onChange,
  onClear,
  totalResults,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // The panel is a bottom sheet on phones; lock the page behind it while open.
  useEffect(() => {
    if (!isPanelOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isPanelOpen]);

  const activeChips: ActiveChip[] = [];
  if (filters.category) {
    activeChips.push({
      key: 'category',
      label: strings.catalog.categories[filters.category],
    });
  }
  if (filters.condition) {
    activeChips.push({
      key: 'condition',
      label: strings.catalog.conditions[filters.condition],
    });
  }
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    activeChips.push({
      key: 'minPrice',
      label: `${strings.catalog.priceMin}: ${filters.minPrice}`,
    });
  }
  if (filters.maxPrice !== undefined) {
    activeChips.push({
      key: 'maxPrice',
      label: `${strings.catalog.priceMax}: ${filters.maxPrice}`,
    });
  }

  const hasActiveFilters = activeChips.length > 0;

  const handleCategoryClick = (cat?: Category) => {
    onChange({
      ...filters,
      category: filters.category === cat ? undefined : cat,
    });
  };

  const handleConditionClick = (cond?: Condition) => {
    onChange({
      ...filters,
      condition: filters.condition === cond ? undefined : cond,
    });
  };

  const handleRemoveChip = (key: ActiveChip['key']) => {
    onChange({
      ...filters,
      [key]: undefined,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      sort: e.target.value as FilterState['sort'],
    });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    onChange({
      ...filters,
      minPrice: val,
    });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    onChange({
      ...filters,
      maxPrice: val,
    });
  };

  const panelBody = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Condition chips */}
      <div>
        <p className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
          {strings.catalog.filterByCondition}
        </p>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((cond) => {
            const isActive = filters.condition === cond.key;
            return (
              <button
                key={cond.key}
                type="button"
                onClick={() => handleConditionClick(cond.key)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-1 ${
                  isActive
                    ? 'bg-ink-900 text-white'
                    : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                }`}
              >
                {isActive && <Check className="w-3 h-3" aria-hidden="true" />}
                {cond.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
          {strings.catalog.filterByPrice}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            aria-label={strings.catalog.priceMin}
            placeholder={strings.catalog.priceMin}
            value={filters.minPrice ?? ''}
            onChange={handleMinPriceChange}
            className="w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900 placeholder-ink-400 transition-colors focus:border-cobalt-500 focus:outline-none focus:ring-2 focus:ring-cobalt-100"
          />
          <span className="text-ink-400 text-xs shrink-0">to</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            aria-label={strings.catalog.priceMax}
            placeholder={strings.catalog.priceMax}
            value={filters.maxPrice ?? ''}
            onChange={handleMaxPriceChange}
            className="w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900 placeholder-ink-400 transition-colors focus:border-cobalt-500 focus:outline-none focus:ring-2 focus:ring-cobalt-100"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 mb-6">
      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => handleCategoryClick(undefined)}
          aria-pressed={!filters.category}
          className={`shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 ${
            !filters.category
              ? 'bg-cobalt-600 text-white shadow-sm shadow-cobalt-100'
              : 'bg-surface text-ink-700 border border-ink-200 hover:border-ink-300 hover:bg-chalk'
          }`}
        >
          {strings.catalog.allCategories}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => handleCategoryClick(cat.key)}
            aria-pressed={filters.category === cat.key}
            className={`shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 ${
              filters.category === cat.key
                ? 'bg-cobalt-600 text-white shadow-sm shadow-cobalt-100'
                : 'bg-surface text-ink-700 border border-ink-200 hover:border-ink-300 hover:bg-chalk'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant={hasActiveFilters ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setIsPanelOpen((prev) => !prev)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            aria-expanded={isPanelOpen}
            aria-controls="filter-panel"
          >
            Filters
            {hasActiveFilters && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-bold">
                {activeChips.length}
              </span>
            )}
          </Button>

          {totalResults !== undefined && (
            <span className="text-xs text-ink-500 hidden sm:inline-block">
              {strings.catalog.showingResults.replace('{count}', String(totalResults))}
            </span>
          )}
        </div>

        {/* Sort select */}
        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="catalog-sort" className="sr-only">
            {strings.catalog.sortBy}
          </label>
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-ink-400 absolute left-3 pointer-events-none" />
            <select
              id="catalog-sort"
              value={filters.sort || 'newest'}
              onChange={handleSortChange}
              className="pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-surface border border-ink-200 rounded-lg text-ink-700 focus:outline-none focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100 appearance-none font-semibold cursor-pointer"
            >
              <option value="newest">{strings.catalog.sortOptions.newest}</option>
              <option value="price_asc">{strings.catalog.sortOptions.price_asc}</option>
              <option value="price_desc">{strings.catalog.sortOptions.price_desc}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleRemoveChip(chip.key)}
              className="inline-flex items-center gap-1 rounded-full border border-cobalt-200 bg-cobalt-50 px-3 py-1 text-xs font-semibold text-cobalt-700 transition-colors hover:bg-cobalt-100 focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-1"
              aria-label={`Remove filter: ${chip.label}`}
            >
              <span>{chip.label}</span>
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-ink-500 underline underline-offset-2 hover:text-ink-800"
          >
            {strings.catalog.clearFilters}
          </button>
        </div>
      )}

      {/* Desktop inline panel */}
      {isPanelOpen && (
        <div
          id="filter-panel"
          className="hidden md:block bg-surface p-5 rounded-xl border border-ink-200 shadow-sm"
        >
          {panelBody}
        </div>
      )}

      {/* Mobile bottom sheet */}
      {isPanelOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={() => setIsPanelOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-4xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-ink-900">Filters</h2>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-chalk focus-visible:ring-2 focus-visible:ring-cobalt-500"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {panelBody}

            <div className="mt-5 pt-4 border-t border-ink-100 flex items-center gap-3">
              <Button variant="outline" fullWidth onClick={onClear} disabled={!hasActiveFilters}>
                {strings.catalog.clearFilters}
              </Button>
              <Button variant="primary" fullWidth onClick={() => setIsPanelOpen(false)}>
                Show {totalResults !== undefined ? totalResults : ''} results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
