import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Package,
  CheckCircle,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api';
import { Listing, Review, SellerProfile as SellerProfileType } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ui/Toast';
import { RatingSummary } from '../components/reviews/RatingSummary';
import { ReviewList } from '../components/reviews/ReviewList';
import { ReviewModal } from '../components/reviews/ReviewModal';
import { ListingCard } from '../components/listings/ListingCard';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { getInitials } from '../utils/format';
import { strings } from '../i18n/strings';

export const SellerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [profileData, setProfileData] = useState<SellerProfileType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'reviews' | 'listings'>('reviews');
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSellerData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [profile, sellerReviews, allListings] = await Promise.all([
        api.getSellerProfile(id),
        api.getSellerReviews(id),
        api.getListings({ pageSize: 50 }),
      ]);

      setProfileData(profile);
      setReviews(sellerReviews);

      // Filter active listings belonging to this seller
      const sellerListings = allListings.items.filter(
        (l) => l.sellerId === id && l.status === 'active'
      );
      setActiveListings(sellerListings);
    } catch (e) {
      console.error('Failed to load seller profile', e);
      toast.error('Failed to load seller profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, [id]);

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.deleteReview(reviewId);
      toast.success(strings.reviews.reviewDeleted);
      loadSellerData();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete review.');
    }
  };

  const handleModalSubmit = async (data: {
    rating: 1 | 2 | 3 | 4 | 5;
    tags: any[];
    comment: string;
  }) => {
    if (!editingReview) return;
    await api.updateReview(editingReview.id, data);
    toast.success(strings.reviews.reviewUpdated);
    loadSellerData();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="Seller not found"
          description="The seller profile you are looking for does not exist."
          actionLabel={strings.notFound.backHomeBtn}
          onAction={() => window.location.href = '#/'}
        />
      </div>
    );
  }

  const { user, stats, activeListingsCount, soldCount } = profileData;

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-6">
      {/* Back to Catalog */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {strings.listingDetails.backToCatalog}
        </Link>
      </div>

      {/* Seller Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-indigo-50"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center">
                {getInitials(user.name)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {user.name}
                </h1>
                <span title={strings.listingDetails.verifiedStudent}>
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm text-slate-500">
                {user.faculty && <span>{user.faculty}</span>}
                {user.year && <span>• Year {user.year}</span>}
                {user.telegram && (
                  <span className="text-indigo-600 font-medium">
                    {user.telegram}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Activity counters */}
          <div className="flex items-center gap-4 self-stretch sm:self-auto justify-around sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <div className="text-center">
              <span className="block text-lg font-bold text-slate-900">
                {activeListingsCount}
              </span>
              <span className="text-xs text-slate-500">Active</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <span className="block text-lg font-bold text-emerald-600">
                {soldCount}
              </span>
              <span className="text-xs text-slate-500">Sold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graduation Cap Rating Summary Card */}
      <RatingSummary stats={stats} />

      {/* Tabs: Reviews vs Active Listings */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>
              {strings.reviews.title} ({reviews.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'listings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>
              {strings.sellerProfile.activeListings} ({activeListings.length})
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'reviews' ? (
          <ReviewList
            reviews={reviews}
            currentUserId={currentUser?.id}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
          />
        ) : (
          <div>
            {activeListings.length === 0 ? (
              <EmptyState
                icon={<Package className="w-8 h-8" />}
                title={strings.sellerProfile.noListings}
                description={strings.sellerProfile.noListingsDesc}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeListings.map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Review Modal */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReview(null);
        }}
        onSubmit={handleModalSubmit}
        existingReview={editingReview}
        listingTitle={editingReview?.listingTitle}
      />
    </div>
  );
};
