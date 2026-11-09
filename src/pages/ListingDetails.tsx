import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  Share2,
  Calendar,
  Tag,
  ShieldCheck,
  MessageCircle,
  Edit3,
  Trash2,
  CheckCircle,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { api, Listing } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from '../components/ui/Toast';
import { strings } from '../i18n/strings';
import { formatPrice, formatDate, getInitials } from '../utils/format';
import { Gallery } from '../components/listings/Gallery';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

export const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const toast = useToast();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api
      .getListing(id)
      .then((data) => {
        setListing(data);
      })
      .catch((err) => {
        console.error('Failed to load listing', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-6">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <Skeleton className="aspect-[4/3] rounded-2xl w-full mb-3" />
            <div className="flex gap-2">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <Skeleton className="w-16 h-16 rounded-xl" />
              <Skeleton className="w-16 h-16 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {strings.listingDetails.notFoundTitle}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {strings.listingDetails.notFoundDesc}
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          {strings.listingDetails.backToCatalog}
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === listing.sellerId;
  const isFav = isFavorite(listing.id);
  const isSold = listing.status === 'sold';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(strings.listingDetails.linkCopied);
  };

  const handleToggleSold = async () => {
    if (!listing) return;
    setIsUpdatingStatus(true);
    try {
      const nextStatus = isSold ? 'active' : 'sold';
      const updated = await api.setListingStatus(listing.id, nextStatus);
      setListing(updated);
      toast.success(
        nextStatus === 'sold'
          ? 'Listing marked as sold.'
          : 'Listing reactivated.'
      );
    } catch (e: any) {
      toast.error('Failed to update listing status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!listing) return;
    setIsDeleting(true);
    try {
      await api.deleteListing(listing.id);
      toast.success(strings.listingDetails.deleteSuccess);
      navigate('/my-listings', { replace: true });
    } catch (e: any) {
      toast.error('Failed to delete listing.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-6">
      {/* Back button */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {strings.listingDetails.backToCatalog}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery */}
        <div className="lg:col-span-7">
          <Gallery images={listing.images} title={listing.title} />
        </div>

        {/* Right Column: Listing Information & Actions */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          {/* Header & Price */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="condition" condition={listing.condition} size="md" />
                <Badge variant="category" category={listing.category} size="md" />
              </div>
              <Badge variant="status" status={listing.status} size="md" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-3">
              {listing.title}
            </h1>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900">
                {formatPrice(listing.price)}
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {strings.listingDetails.postedOn} {formatDate(listing.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Seller Card */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {strings.listingDetails.sellerInfo}
            </h3>
            <div className="flex items-center gap-3">
              {listing.seller?.avatarUrl ? (
                <img
                  src={listing.seller.avatarUrl}
                  alt={listing.seller.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-50"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                  {getInitials(listing.seller?.name || 'S')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-slate-900 truncate">
                    {listing.seller?.name || 'Student Seller'}
                  </span>
                  <span title="Verified University Student">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  </span>
                </div>
                {listing.seller?.faculty && (
                  <p className="text-xs text-slate-500 truncate">
                    {listing.seller.faculty}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            {isOwner ? (
              /* Owner Controls */
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <Link to={`/listings/${listing.id}/edit`} className="w-full">
                    <Button
                      variant="outline"
                      fullWidth
                      leftIcon={<Edit3 className="w-4 h-4" />}
                    >
                      {strings.listingDetails.editListing}
                    </Button>
                  </Link>

                  <Button
                    variant={isSold ? 'outline' : 'secondary'}
                    fullWidth
                    isLoading={isUpdatingStatus}
                    onClick={handleToggleSold}
                    leftIcon={isSold ? <RotateCcw className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  >
                    {isSold ? strings.listingDetails.reactivate : strings.listingDetails.markAsSold}
                  </Button>
                </div>

                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => setIsDeleteModalOpen(true)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  {strings.listingDetails.deleteListing}
                </Button>
              </div>
            ) : (
              /* Buyer Controls */
              <div className="space-y-3">
                {/* Contact reveal toggle */}
                {!showContact ? (
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    disabled={isSold}
                    onClick={() => setShowContact(true)}
                    leftIcon={<MessageCircle className="w-5 h-5" />}
                  >
                    {isSold ? strings.listingDetails.soldBadge : strings.listingDetails.showContact}
                  </Button>
                ) : (
                  <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                        {strings.listingDetails.contactInfoTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowContact(false)}
                        className="text-xs text-indigo-700 underline hover:text-indigo-900"
                      >
                        Hide
                      </button>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-indigo-200">
                      <span className="text-sm font-semibold text-slate-800 select-all">
                        {listing.contact || 'No contact specified'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Reach out directly via Telegram or email to arrange meetup on campus.
                    </p>
                  </div>
                )}

                {/* Secondary buttons: Favorite & Copy Link */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={isFav ? 'secondary' : 'outline'}
                    fullWidth
                    onClick={() => toggleFavorite(listing)}
                    leftIcon={
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
                        }`}
                      />
                    }
                  >
                    {isFav ? 'Saved' : 'Save'}
                  </Button>

                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleCopyLink}
                    leftIcon={<Share2 className="w-4 h-4" />}
                  >
                    {strings.listingDetails.copyLink}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={strings.listingDetails.deleteConfirmTitle}
        description={strings.listingDetails.deleteConfirmDesc}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          This will permanently remove &quot;{listing.title}&quot; from the catalog.
        </p>
      </Modal>
    </div>
  );
};
