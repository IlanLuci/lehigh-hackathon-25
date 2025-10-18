const express = require('express');
const router = express.Router();
const {
  getReviewsByMenuItem,
  createReview,
  deleteReview,
  markReviewHelpful
} = require('../controllers/review.controller');

// GET /api/reviews/menu/:menuItemId - Get all reviews for a menu item
router.get('/menu/:menuItemId', getReviewsByMenuItem);

// POST /api/reviews - Create a new review
router.post('/', createReview);

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', deleteReview);

// PUT /api/reviews/:id/helpful - Mark review as helpful
router.put('/:id/helpful', markReviewHelpful);

module.exports = router;
