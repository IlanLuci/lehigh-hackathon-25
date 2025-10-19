const Review = require('../models/Review.db');
const MenuItem = require('../models/MenuItem.db');
const { uploadMultipleImages, deleteImageFromS3 } = require('../config/s3');

// Get all reviews for a menu item
const getReviewsByMenuItem = async (req, res) => {
  try {
    const reviews = await Review.getByMenuItem(req.params.menuItemId);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

// Create a new review
const createReview = async (req, res) => {
  try {
    const { menuItemId, rating, comment, userName } = req.body;

    // Validate required fields
    if (!menuItemId || !rating) {
      return res.status(400).json({ message: 'Menu item ID and rating are required' });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if menu item exists
    const menuItem = await MenuItem.getById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Handle file uploads if present
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        photoUrls = await uploadMultipleImages(req.files);
      } catch (uploadError) {
        console.error('Error uploading images:', uploadError);
        return res.status(500).json({ message: 'Error uploading images', error: uploadError.message });
      }
    }

    // Create review
    const newReview = await Review.create({
      menuItemId: parseInt(menuItemId),
      rating: parseFloat(rating),
      comment,
      userName: userName || 'Anonymous',
      photos: photoUrls
    });

    // Update menu item's average rating
    const { averageRating, totalReviews } = await Review.calculateAverageRating(menuItemId);
    await MenuItem.updateRating(menuItemId, averageRating, totalReviews);

    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const review = await Review.delete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Delete associated photos from S3
    if (review.photos && review.photos.length > 0) {
      for (const photoUrl of review.photos) {
        try {
          await deleteImageFromS3(photoUrl);
        } catch (s3Error) {
          console.error('Error deleting image from S3:', s3Error);
          // Continue even if S3 deletion fails
        }
      }
    }

    const menuItemId = review.menu_item_id;

    // Update menu item's average rating
    const { averageRating, totalReviews } = await Review.calculateAverageRating(menuItemId);
    await MenuItem.updateRating(menuItemId, averageRating, totalReviews);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};

// Mark review as helpful
const markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.markHelpful(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ message: 'Error marking review as helpful', error: error.message });
  }
};

module.exports = {
  getReviewsByMenuItem,
  createReview,
  deleteReview,
  markReviewHelpful
};
