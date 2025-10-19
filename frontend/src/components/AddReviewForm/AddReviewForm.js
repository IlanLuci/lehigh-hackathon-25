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
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreview(prevPreviews => [...prevPreviews, ...previews]);
    
    // Store File objects to be sent as FormData
    setPhotoFiles(prevFiles => [...prevFiles, ...files]);
  };

  const removePhoto = (index) => {
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
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
      // Create FormData to send files along with form data
      const formData = new FormData();
      formData.append('menuItemId', menuItemId);
      formData.append('rating', rating);
      formData.append('comment', comment);
      formData.append('userName', userName || 'Anonymous');
      
      // Append photo files
      photoFiles.forEach(file => {
        formData.append('photos', file);
      });

      await createReview(formData);

      // Save username locally for future reviews
      if (userName && userName.trim()) {
        localStorage.setItem('reviewUserName', userName.trim());
      }

      // Reset form
      setRating(0);
      setComment('');
  // Do not reset username so it persists for future reviews
      setPhotoFiles([]);
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
          <label>Upload Photo (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={photoPreview.length >= 1}
          />
          <small>You can upload 1 photo</small>
          
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
