import React from 'react';
import { Edit2, Trash2, ShoppingBag } from 'lucide-react';
import { Review } from '../../api/types';
import { RatingIcons } from './RatingIcons';
import { TagChips } from './TagChips';
import { formatDate, getInitials } from '../../utils/format';

interface ReviewCardProps {
  review: Review;
  isAuthor?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  className?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isAuthor = false,
  onEdit,
  onDelete,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 transition-all duration-150 hover:border-gray-300 shadow-sm ${className}`}
    >
      {/* Header: Reviewer info, date, and actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {review.reviewerAvatarUrl ? (
            <img
              src={review.reviewerAvatarUrl}
              alt={review.reviewerName}
              className="w-10 h-10 rounded-full object-cover border border-gray-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-sm border border-indigo-200">
              {getInitials(review.reviewerName || 'Student')}
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-900 leading-tight">
              {review.reviewerName || 'Anonymous Student'}
            </h4>
            <span className="text-xs text-gray-400">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>

        {/* Actions for review author */}
        {isAuthor && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(review)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit review"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(review)}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rating Caps */}
      <div className="mt-3 flex items-center gap-2">
        <RatingIcons value={review.rating} size="sm" />
      </div>

      {/* Snapshot of listing title */}
      {review.listingTitle && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-600 border border-gray-100">
          <ShoppingBag className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[240px]">{review.listingTitle}</span>
        </div>
      )}

      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <div className="mt-3">
          <TagChips tags={review.tags} size="sm" />
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="mt-3 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
};
