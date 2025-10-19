import React from 'react';
import '../../styles/StarRating.css';

const StarRating = ({ rating, onRatingChange, readonly = false, size = 'medium' }) => {
  const stars = [1, 2, 3, 4, 5];
  
  // Ensure rating is a number
  const numericRating = parseFloat(rating) || 0;

  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className={`star-rating ${size} ${readonly ? 'readonly' : ''}`}>
      {stars.map((star) => (
        <span
          key={star}
          className={`star ${star <= numericRating ? 'filled' : ''}`}
          onClick={() => handleClick(star)}
          style={{ cursor: readonly ? 'default' : 'pointer' }}
        >
          ★
        </span>
      ))}
      {readonly && numericRating > 0 && (
        <span className="rating-value">({numericRating.toFixed(1)})</span>
      )}
    </div>
  );
};

export default StarRating;
