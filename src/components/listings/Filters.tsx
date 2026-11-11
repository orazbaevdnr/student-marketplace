import React, { useState } from 'react';
import { SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
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

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onChange,
  onClear,
  totalResults,
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.condition ||
    (filters.minPrice !== undefined && filters.minPrice > 0) ||
    filters.maxPrice !== undefined
  );

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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      sort: e.target.value as any,
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

  return (
    <div className="space-y-4 mb-6">
      {/* Category Pills (Horizontal scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => handleCategoryClick(undefined)}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            !filters.category
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {strings.catalog.allCategories}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => handleCategoryClick(cat.key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              filters.category === cat.key
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Control bar: Mobile Toggle, Total count, Sort Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <Button
            variant={hasActiveFilters ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setIsOpenMobile((prev) => !prev)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Filters {hasActiveFilters && '•'}
          </Button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium underline"
            >
              <X className="w-3.5 h-3.5" />
              {strings.catalog.clearFilters}
            </button>
          )}

          {totalResults !== undefined && (
            <span className="text-xs text-slate-500 hidden sm:inline-block">
              {strings.catalog.showingResults.replace('{count}', String(totalResults))}
            </span>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={filters.sort || 'newest'}
              onChange={handleSortChange}
              className="pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs appearance-none font-medium cursor-pointer"
            >
              <option value="newest">{strings.catalog.sortOptions.newest}</option>
              <option value="price_asc">{strings.catalog.sortOptions.price_asc}</option>
              <option value="price_desc">{strings.catalog.sortOptions.price_desc}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expanded filters panel */}
      {isOpenMobile && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Condition chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {strings.catalog.filterByCondition}
              </label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((cond) => (
                  <button
                    key={cond.key}
                    type="button"
                    onClick={() => handleConditionClick(cond.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filters.condition === cond.key
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {strings.catalog.filterByPrice} (₸)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder={strings.catalog.priceMin}
                  value={filters.minPrice ?? ''}
                  onChange={handleMinPriceChange}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-400 text-xs">—</span>
                <input
                  type="number"
                  min="0"
                  placeholder={strings.catalog.priceMax}
                  value={filters.maxPrice ?? ''}
                  onChange={handleMaxPriceChange}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
