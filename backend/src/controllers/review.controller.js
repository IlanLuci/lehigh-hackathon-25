const Review = require('../models/Review');
const MenuItem = require('../models/MenuItem');

// Get all reviews for a menu item
const getReviewsByMenuItem = (req, res) => {
  try {
    const reviews = Review.getByMenuItemId(req.params.menuItemId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

// Create a new review
const createReview = (req, res) => {
  try {
    const { menuItemId, rating, comment, userName, photos } = req.body;

    // Validate required fields
    if (!menuItemId || !rating) {
      return res.status(400).json({ message: 'Menu item ID and rating are required' });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if menu item exists
    const menuItem = MenuItem.getById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Create review
    const newReview = Review.create({
      menuItemId: parseInt(menuItemId),
      rating: parseFloat(rating),
      comment,
      userName,
      photos: photos || []
    });

    // Update menu item's average rating
    const averageRating = Review.getAverageRating(menuItemId);
    const totalReviews = Review.getByMenuItemId(menuItemId).length;
    MenuItem.updateRating(menuItemId, averageRating, totalReviews);

    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

// Delete a review
const deleteReview = (req, res) => {
  try {
    const review = Review.getById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const menuItemId = review.menuItemId;
    Review.delete(req.params.id);

    // Update menu item's average rating
    const averageRating = Review.getAverageRating(menuItemId);
    const totalReviews = Review.getByMenuItemId(menuItemId).length;
    MenuItem.updateRating(menuItemId, averageRating, totalReviews);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};

// Mark review as helpful
const markReviewHelpful = (req, res) => {
  try {
    const review = Review.markHelpful(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error marking review as helpful', error: error.message });
  }
};

module.exports = {
  getReviewsByMenuItem,
  createReview,
  deleteReview,
  markReviewHelpful
};
