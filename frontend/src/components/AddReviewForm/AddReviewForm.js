import React, { useState, useEffect } from 'react';
import StarRating from '../StarRating/StarRating';
import { createReview } from '../../services/menuService';
import '../../styles/AddReviewForm.css';

const AddReviewForm = ({ menuItemId, onReviewAdded }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  // On mount, pre-populate username from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('reviewUserName');
    if (savedName) setUserName(savedName);
  }, []);
  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreview(prevPreviews => [...prevPreviews, ...previews]);
    
    // For demo purposes, we'll store base64 encoded images
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prevPhotos => [...prevPhotos, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {

      await createReview({
        menuItemId,
        rating,
        comment,
        userName: userName || 'Anonymous',
        photos
      });

      // Save username locally for future reviews
      if (userName && userName.trim()) {
        localStorage.setItem('reviewUserName', userName.trim());
      }

      // Reset form
      setRating(0);
      setComment('');
  // Do not reset username so it persists for future reviews
      setPhotos([]);
      setPhotoPreview([]);
      
      // Notify parent component
      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-review-form">
      <h3>Add Your Review</h3>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Rating *</label>
          <StarRating rating={rating} onRatingChange={setRating} size="large" />
        </div>

        <div className="form-group">
          <label>Your Name (Optional)</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Leave blank for Anonymous"
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label>Your Review</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this dish..."
            rows={4}
            maxLength={500}
          />
          <small>{comment.length}/500 characters</small>
        </div>

        <div className="form-group">
          <label>Upload Photos (Optional)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            disabled={photoPreview.length >= 3}
          />
          <small>You can upload up to 3 photos</small>
          
          {photoPreview.length > 0 && (
            <div className="photo-preview-grid">
              {photoPreview.map((preview, index) => (
                <div key={index} className="photo-preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-photo"
                    onClick={() => removePhoto(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-review-btn"
          disabled={isSubmitting || rating === 0}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default AddReviewForm;
