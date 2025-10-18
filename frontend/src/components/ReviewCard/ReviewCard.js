import React from 'react';
import StarRating from '../StarRating/StarRating';
import '../../styles/ReviewCard.css';

const ReviewCard = ({ review, onMarkHelpful }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-author">
          <div className="author-avatar">
            {review.userName.charAt(0).toUpperCase()}
          </div>
          <div className="author-info">
            <span className="author-name">{review.userName}</span>
            <span className="review-date">{formatDate(review.createdAt)}</span>
          </div>
        </div>
        <StarRating rating={review.rating} readonly size="small" />
      </div>

      {review.comment && (
        <div className="review-comment">
          <p>{review.comment}</p>
        </div>
      )}

      {review.photos && review.photos.length > 0 && (
        <div className="review-photos">
          {review.photos.map((photo, index) => (
            <img 
              key={index} 
              src={photo} 
              alt={`Review photo ${index + 1}`}
              className="review-photo"
            />
          ))}
        </div>
      )}

      <div className="review-actions">
        <button 
          className="helpful-btn"
          onClick={() => onMarkHelpful(review.id)}
        >
          👍 Helpful {review.helpful > 0 && `(${review.helpful})`}
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;
