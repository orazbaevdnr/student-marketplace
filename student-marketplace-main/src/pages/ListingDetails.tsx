import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  Share2,
  Calendar,
  ShieldCheck,
  MessageCircle,
  Edit3,
  Trash2,
  CheckCircle,
  ArrowLeft,
  RotateCcw,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { api } from '../api';
import { Listing, Review, SellerStats } from '../api/types';
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
import { SafeImage } from '../components/ui/SafeImage';
import { RatingIcons } from '../components/reviews/RatingIcons';
import { RatingSummary } from '../components/reviews/RatingSummary';
import { ReviewList } from '../components/reviews/ReviewList';
import { ReviewModal } from '../components/reviews/ReviewModal';
import { SellerBadges } from '../components/reviews/SellerBadges';

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

  // Reviews state
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [sellerReviews, setSellerReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const loadReviewsData = async (sellerId: string, listingId: string, currentUserId?: string) => {
    try {
      const [reviews, profile] = await Promise.all([
        api.getSellerReviews(sellerId),
        api.getSellerProfile(sellerId),
      ]);
      setSellerReviews(reviews);
      setSellerStats(profile.stats);

      if (currentUserId) {
        const mine = await api.getMyReviewForListing(currentUserId, listingId);
        setMyReview(mine);
      }
    } catch (e) {
      console.error('Failed to load reviews data', e);
    }
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api
      .getListing(id)
      .then((data) => {
        setListing(data);
        if (data?.sellerId) {
          loadReviewsData(data.sellerId, data.id, user?.id);
        }
      })
      .catch((err) => {
        console.error('Failed to load listing', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, user?.id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-6">
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
        <h2 className="font-display text-xl font-bold text-ink-900 mb-2">
          {strings.listingDetails.notFoundTitle}
        </h2>
        <p className="text-sm text-ink-500 mb-6">
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

  const handleOpenReviewModal = (reviewToEdit?: Review | null) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/listing/${listing.id}` } } });
      return;
    }
    setEditingReview(reviewToEdit !== undefined ? reviewToEdit : myReview);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (data: {
    rating: 1 | 2 | 3 | 4 | 5;
    tags: any[];
    comment: string;
  }) => {
    if (!listing || !user) return;
    if (editingReview) {
      await api.updateReview(editingReview.id, data);
      toast.success(strings.reviews.reviewUpdated);
    } else {
      await api.createReview({
        sellerId: listing.sellerId,
        reviewerId: user.id,
        listingId: listing.id,
        listingTitle: listing.title,
        reviewerName: user.name || 'Student',
        reviewerAvatarUrl: user.avatarUrl,
        rating: data.rating,
        tags: data.tags,
        comment: data.comment,
      });
      toast.success(strings.reviews.reviewSubmitted);
    }
    loadReviewsData(listing.sellerId, listing.id, user.id);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!listing) return;
    try {
      await api.deleteReview(reviewId);
      toast.success(strings.reviews.reviewDeleted);
      setMyReview(null);
      loadReviewsData(listing.sellerId, listing.id, user?.id);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete review.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-2 sm:py-6 space-y-10">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-ink-500 hover:text-ink-900 transition-colors"
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
        <div className="lg:col-span-5 bg-surface p-5 sm:p-6 rounded-2xl border border-ink-200 space-y-6">
          {/* Header & Price */}
          <div>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <Badge variant="category" category={listing.category} />
              <Badge variant="condition" condition={listing.condition} />
              {isSold && <Badge variant="status" status="sold" />}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">
              {listing.title}
            </h1>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-ink-900 [font-variant-numeric:tabular-nums]">
                {formatPrice(listing.price)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-ink-400 mt-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {strings.listingDetails.postedOn} {formatDate(listing.createdAt)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-ink-100 pt-4">
            <h3 className="text-xs font-semibold text-ink-500 mb-2">Description</h3>
            <p className="text-sm text-ink-700 whitespace-pre-line leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Seller Info Card with Rating & Link to Profile */}
          <div className="border-t border-ink-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-ink-500">
                {strings.listingDetails.sellerInfo}
              </h3>
              <Link
                to={`/seller/${listing.sellerId}`}
                className="text-xs font-semibold text-cobalt-700 hover:text-cobalt-800 flex items-center gap-0.5 transition-colors"
              >
                <span>{strings.listingDetails.viewSellerProfile}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <Link
              to={`/seller/${listing.sellerId}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-chalk border border-ink-200 hover:border-cobalt-200 hover:bg-cobalt-50/40 transition-all group"
            >
              {listing.seller?.avatarUrl ? (
                <SafeImage
                  src={listing.seller.avatarUrl}
                  alt={listing.seller.name}
                  fallbackLabel=""
                  iconClassName="w-4 h-4"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-cobalt-100 shrink-0"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-cobalt-100 text-cobalt-700 font-bold text-sm flex items-center justify-center shrink-0">
                  {getInitials(listing.seller?.name || 'S')}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-ink-900 truncate group-hover:text-cobalt-700 transition-colors">
                    {listing.seller?.name || 'Student Seller'}
                  </span>
                  <span title="Verified University Student">
                    <ShieldCheck className="w-4 h-4 text-mint-500 shrink-0" />
                  </span>
                </div>

                {/* Seller rating or new seller badge */}
                {sellerStats && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {sellerStats.reviewCount < 3 ? (
                      <span className="text-xs font-semibold text-cobalt-700 bg-cobalt-50 px-1.5 py-0.5 rounded">
                        {strings.reviews.newSeller}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <RatingIcons value={sellerStats.averageRating} size="sm" />
                        <span className="text-xs font-bold text-ink-700">
                          {sellerStats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-ink-400">
                          ({sellerStats.reviewCount})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {listing.seller?.faculty && (
                  <p className="text-xs text-ink-500 truncate mt-0.5">
                    {listing.seller.faculty}
                  </p>
                )}
              </div>
            </Link>

            {sellerStats?.badges && sellerStats.badges.length > 0 && (
              <div className="mt-2.5">
                <SellerBadges badges={sellerStats.badges} size="sm" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-ink-100 pt-5 space-y-3">
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
                    {strings.listingDetails.showContact}
                  </Button>
                ) : (
                  <div className="p-4 rounded-xl bg-cobalt-50 border border-cobalt-100 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-cobalt-900">
                        {strings.listingDetails.contactInfoTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowContact(false)}
                        className="text-xs text-cobalt-700 hover:text-cobalt-800 font-semibold"
                      >
                        {strings.listingDetails.hideContact}
                      </button>
                    </div>
                    <div className="p-3 bg-surface rounded-lg border border-cobalt-100">
                      <span className="text-sm font-semibold text-ink-800 break-all select-all">
                        {listing.contact}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-500 mt-2">
                      Reach out directly via Telegram or email to arrange meetup on campus.
                    </p>
                  </div>
                )}

                {/* Review button for buyers */}
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => handleOpenReviewModal()}
                  leftIcon={<MessageSquare className="w-4 h-4 text-cobalt-600" />}
                >
                  {myReview ? strings.listingDetails.editReview : strings.listingDetails.leaveReview}
                </Button>

                {/* Secondary buttons: Favorite & Copy Link */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={isFav ? 'secondary' : 'outline'}
                    fullWidth
                    onClick={() => toggleFavorite(listing)}
                    aria-pressed={isFav}
                    leftIcon={
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? 'fill-coral-500 text-coral-500' : 'text-ink-600'
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

      {/* Seller Reviews Full Section below details */}
      <div className="border-t border-ink-200 pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cobalt-600" />
              <h2 className="font-display text-xl font-bold text-ink-900">
                {strings.listingDetails.reviewsSection}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
              Verified feedback from students who traded with {listing.seller?.name || 'this seller'}
            </p>
          </div>

          {!isOwner && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenReviewModal()}
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              {myReview ? strings.listingDetails.editReview : strings.listingDetails.leaveReview}
            </Button>
          )}
        </div>

        {/* Detailed Rating Summary */}
        {sellerStats && <RatingSummary stats={sellerStats} />}

        {/* Reviews List */}
        <ReviewList
          reviews={sellerReviews}
          currentUserId={user?.id}
          onEditReview={(r) => handleOpenReviewModal(r)}
          onDeleteReview={handleDeleteReview}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={strings.listingDetails.deleteConfirmTitle}
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            {strings.listingDetails.deleteConfirmDesc}
          </p>
          <div className="flex justify-end gap-3 pt-2">
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
              Delete listing
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave / Edit Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setEditingReview(null);
        }}
        onSubmit={handleReviewSubmit}
        existingReview={editingReview}
        listingTitle={listing.title}
      />
    </div>
  );
};
