import React, { useState } from 'react';
import StarRating from '../StarRating/StarRating';
import ReviewCard from '../ReviewCard/ReviewCard';
import AddReviewForm from '../AddReviewForm/AddReviewForm';
import { getReviewsByMenuItem, markReviewHelpful } from '../../services/menuService';
import '../../styles/MenuItemCard.css';

const MenuItemCard = ({ item }) => {
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showAddReview, setShowAddReview] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const reviewData = await getReviewsByMenuItem(item.id);
      setReviews(reviewData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReviews = () => {
    if (!showReviews && reviews.length === 0) {
      loadReviews();
    }
    setShowReviews(!showReviews);
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await markReviewHelpful(reviewId);
      // Reload reviews to get updated helpful count
      loadReviews();
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  const handleReviewAdded = () => {
    setShowAddReview(false);
    loadReviews();
    // Optionally reload the page or update the menu item to reflect new average rating
    window.location.reload();
  };

  return (
    <div className="menu-item-card">
      <div className="menu-item-header">
        <div className="menu-item-main">
          <h3 className="menu-item-name">{item.name}</h3>
          <span className="menu-item-station">{item.station}</span>
        </div>
        <div className="menu-item-rating">
          <StarRating 
            rating={item.averageRating} 
            readonly 
            size="medium"
          />
          {item.totalReviews > 0 && (
            <span className="review-count">
              {item.totalReviews} {item.totalReviews === 1 ? 'review' : 'reviews'}
            </span>
          )}
        </div>
      </div>

      <p className="menu-item-description">{item.description}</p>

      {item.dietaryInfo && item.dietaryInfo.length > 0 && (
        <div className="dietary-info">
          {item.dietaryInfo.map((info, index) => (
            <span key={index} className="dietary-tag">{info}</span>
          ))}
        </div>
      )}

      <div className="menu-item-actions">
        <button 
          className="btn btn-secondary"
          onClick={handleToggleReviews}
        >
          {showReviews ? 'Hide Reviews' : 'View Reviews'}
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddReview(!showAddReview)}
        >
          {showAddReview ? 'Cancel' : 'Add Review'}
        </button>
      </div>

      {showAddReview && (
        <AddReviewForm 
          menuItemId={item.id} 
          onReviewAdded={handleReviewAdded}
        />
      )}

      {showReviews && (
        <div className="reviews-section">
          <h4>Reviews</h4>
          {loading ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review}
                  onMarkHelpful={handleMarkHelpful}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuItemCard;
