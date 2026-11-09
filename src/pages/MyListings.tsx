import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Plus, Trash2, Edit3, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { api, Listing } from '../api';
import { useAuth } from '../auth/AuthContext';
import { strings } from '../i18n/strings';
import { formatPrice, formatDate } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';

export const MyListings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMyListings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await api.getMyListings(user.id);
      setListings(data);
    } catch (err) {
      console.error('Failed to load my listings', err);
      toast.error('Failed to load your listings');
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const activeListings = listings.filter((l) => l.status === 'active');
  const soldListings = listings.filter((l) => l.status === 'sold');
  const currentList = activeTab === 'active' ? activeListings : soldListings;

  const handleToggleStatus = async (item: Listing) => {
    const nextStatus = item.status === 'active' ? 'sold' : 'active';
    try {
      const updated = await api.setListingStatus(item.id, nextStatus);
      setListings((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l))
      );
      toast.success(
        nextStatus === 'sold'
          ? 'Item marked as sold!'
          : 'Item reactivated in catalog!'
      );
    } catch (e) {
      toast.error('Failed to update status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteListing(deleteTarget.id);
      setListings((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      toast.success(strings.listingDetails.deleteSuccess);
      setDeleteTarget(null);
    } catch (e) {
      toast.error('Failed to delete listing.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {strings.myListings.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {strings.myListings.subtitle}
          </p>
        </div>

        <Link to="/listings/new">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-indigo-100"
          >
            {strings.nav.postListing}
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>{strings.myListings.tabActive}</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-medium">
            {activeListings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sold')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'sold'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>{strings.myListings.tabSold}</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-medium">
            {soldListings.length}
          </span>
        </button>
      </div>

      {/* Content list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4"
            >
              <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/5" />
              </div>
            </div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title={
            activeTab === 'active'
              ? strings.myListings.emptyActiveTitle
              : strings.myListings.emptySoldTitle
          }
          description={
            activeTab === 'active'
              ? strings.myListings.emptyActiveDesc
              : strings.myListings.emptySoldDesc
          }
          actionLabel={
            activeTab === 'active' ? strings.myListings.postFirstListing : undefined
          }
          onAction={() => navigate('/listings/new')}
          className="my-8"
        />
      ) : (
        <div className="space-y-3">
          {currentList.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <Link to={`/listing/${item.id}`} className="shrink-0">
                  <img
                    src={item.images[0] || `https://picsum.photos/seed/${item.id}/200/200`}
                    alt={item.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-slate-100"
                  />
                </Link>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="condition" condition={item.condition} size="sm" />
                    <Badge variant="category" category={item.category} size="sm" />
                    <Badge variant="status" status={item.status} size="sm" />
                  </div>
                  <Link
                    to={`/listing/${item.id}`}
                    className="font-semibold text-slate-900 text-sm sm:text-base hover:text-indigo-600 transition-colors line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {formatPrice(item.price)}
                    </span>
                    <span>•</span>
                    <span>Listed {formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Link to={`/listings/${item.id}/edit`}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    {strings.myListings.actions.edit}
                  </Button>
                </Link>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleToggleStatus(item)}
                  leftIcon={
                    item.status === 'active' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-slate-600" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                    )
                  }
                >
                  {item.status === 'active'
                    ? strings.myListings.actions.markSold
                    : strings.myListings.actions.reactivate}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(item)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 p-2"
                  title={strings.myListings.actions.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={strings.listingDetails.deleteConfirmTitle}
        description={strings.listingDetails.deleteConfirmDesc}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={isDeleting}
            >
              Delete listing
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">
            Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be reversed.
          </p>
        </div>
      </Modal>
    </div>
  );
};
