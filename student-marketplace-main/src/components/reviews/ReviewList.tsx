import React, { useState } from 'react';
import { Review } from '../../api/types';
import { ReviewCard } from './ReviewCard';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { MessageSquare, Trash2 } from 'lucide-react';
import { strings } from '../../i18n/strings';

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: string;
  onEditReview?: (review: Review) => void;
  onDeleteReview?: (reviewId: string) => Promise<void>;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  currentUserId,
  onEditReview,
  onDeleteReview,
  className = '',
  emptyTitle = strings.reviews.noReviews,
  emptyDescription = strings.reviews.noReviewsDesc,
}) => {
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!reviewToDelete || !onDeleteReview) return;
    setDeleting(true);
    try {
      await onDeleteReview(reviewToDelete.id);
      setReviewToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="w-7 h-7" />}
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          isAuthor={Boolean(currentUserId && review.reviewerId === currentUserId)}
          onEdit={onEditReview}
          onDelete={(r) => setReviewToDelete(r)}
        />
      ))}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        title={strings.reviews.deleteConfirmTitle}
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            {strings.reviews.deleteConfirmDesc}
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setReviewToDelete(null)}
              disabled={deleting}
            >
              {strings.common.cancel}
            </Button>
            <Button
              variant="danger"
              leftIcon={<Trash2 className="w-4 h-4" />}
              isLoading={deleting}
              onClick={confirmDelete}
            >
              {strings.common.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
