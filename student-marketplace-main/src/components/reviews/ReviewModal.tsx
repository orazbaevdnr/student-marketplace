import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RatingIcons } from './RatingIcons';
import { TagChips } from './TagChips';
import { Review, ReviewTag } from '../../api/types';
import { getAvailableTags, RATING_LABELS } from '../../utils/reviews';
import { strings } from '../../i18n/strings';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: 1 | 2 | 3 | 4 | 5; tags: ReviewTag[]; comment: string }) => Promise<void>;
  existingReview?: Review | null;
  listingTitle?: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingReview,
  listingTitle,
}) => {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when editing an existing review or resetting
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setSelectedTags(existingReview.tags || []);
      setComment(existingReview.comment || '');
    } else {
      setRating(5);
      setSelectedTags([]);
      setComment('');
    }
    setError(null);
  }, [existingReview, isOpen]);

  // When rating changes, filter out tags that are no longer available in the new group
  const handleRatingChange = (newRating: 1 | 2 | 3 | 4 | 5) => {
    setRating(newRating);
    const available = getAvailableTags(newRating);
    setSelectedTags((prev) => prev.filter((t) => available.includes(t)));
  };

  const handleToggleTag = (tag: ReviewTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        rating,
        tags: selectedTags,
        comment: comment.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || strings.common.error);
    } finally {
      setLoading(false);
    }
  };

  const availableTags = getAvailableTags(rating);
  const maxCommentLength = 300;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingReview ? strings.listingDetails.editReview : strings.listingDetails.leaveReview}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {listingTitle && (
          <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600 border border-gray-100 truncate">
            <span className="font-semibold text-gray-700">Listing: </span>
            {listingTitle}
          </div>
        )}

        {/* Rating Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            {strings.reviews.ratingLabel}
          </label>
          <div className="flex items-center gap-3">
            <RatingIcons
              value={rating}
              interactive
              onChange={handleRatingChange}
              size="lg"
            />
            <span className="text-sm font-bold text-gray-700 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {strings.reviews.ratingLevels[rating] || RATING_LABELS[rating]}
            </span>
          </div>
        </div>

        {/* Dynamic Tags Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {strings.reviews.tagsLabel}
          </label>
          <TagChips
            tags={availableTags}
            selectedTags={selectedTags}
            interactive
            onToggleTag={handleToggleTag}
            size="sm"
          />
        </div>

        {/* Comment field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-semibold text-gray-800">
              {strings.reviews.commentLabel}
            </label>
            <span
              className={`text-xs ${
                comment.length >= maxCommentLength ? 'text-rose-600 font-semibold' : 'text-gray-400'
              }`}
            >
              {strings.reviews.commentLimit.replace('{count}', String(comment.length))}
            </span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, maxCommentLength))}
            rows={3}
            maxLength={maxCommentLength}
            placeholder={strings.reviews.commentPlaceholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {strings.common.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
          >
            {existingReview ? strings.reviews.updateReview : strings.reviews.submitReview}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
