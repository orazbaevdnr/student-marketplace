import React, { useEffect, useState } from 'react';
import { Award, MessageSquare, Sparkles } from 'lucide-react';
import { api } from '../api';
import { Review, SellerStats, User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ui/Toast';
import { TopSellers, TopSellerItem } from '../components/reviews/TopSellers';
import { ReviewList } from '../components/reviews/ReviewList';
import { ReviewModal } from '../components/reviews/ReviewModal';
import { Skeleton } from '../components/ui/Skeleton';
import { strings } from '../i18n/strings';

export const Reviews: React.FC = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [topSellers, setTopSellers] = useState<TopSellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const pagedReviews = await api.getReviews({ pageSize: 50 });
      setReviews(pagedReviews.items);

      // Collect unique sellers and compute their top sellers preview
      const sellerIds = Array.from(new Set(pagedReviews.items.map((r) => r.sellerId)));
      const topSellerData: TopSellerItem[] = [];

      for (const sId of sellerIds.slice(0, 6)) {
        try {
          const profile = await api.getSellerProfile(sId);
          topSellerData.push({
            user: profile.user,
            stats: profile.stats,
            activeListingsCount: profile.activeListingsCount,
          });
        } catch {}
      }

      // Sort by average rating & review count
      topSellerData.sort((a, b) => {
        if (b.stats.averageRating !== a.stats.averageRating) {
          return b.stats.averageRating - a.stats.averageRating;
        }
        return b.stats.reviewCount - a.stats.reviewCount;
      });

      setTopSellers(topSellerData);
    } catch (e) {
      console.error('Failed to load reviews hub', e);
      toast.error('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.deleteReview(reviewId);
      toast.success(strings.reviews.reviewDeleted);
      loadData();
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
    loadData();
  };

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Community Trust</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Student Seller Reviews & Ratings
          </h1>
          <p className="text-sm text-indigo-100">
            Transparent peer-to-peer ratings powered by graduation caps 🎓. Buy and sell with trusted university peers.
          </p>
        </div>
      </div>

      {/* Top Sellers Section */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      ) : (
        <TopSellers sellers={topSellers} />
      )}

      {/* Recent Reviews Feed */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Recent Feedback from Students ({reviews.length})
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : (
          <ReviewList
            reviews={reviews}
            currentUserId={currentUser?.id}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
          />
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
