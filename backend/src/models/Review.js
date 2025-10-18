// In-memory data store for reviews
// In production, this would be replaced with a database

let reviews = [];
let reviewIdCounter = 1;

class Review {
  static getAll() {
    return reviews;
  }

  static getByMenuItemId(menuItemId) {
    return reviews
      .filter(review => review.menuItemId === parseInt(menuItemId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static getById(id) {
    return reviews.find(review => review.id === parseInt(id));
  }

  static create(reviewData) {
    const newReview = {
      id: reviewIdCounter++,
      menuItemId: reviewData.menuItemId,
      rating: reviewData.rating,
      comment: reviewData.comment || '',
      userName: reviewData.userName || 'Anonymous',
      photos: reviewData.photos || [],
      createdAt: new Date().toISOString(),
      helpful: 0
    };
    reviews.push(newReview);
    return newReview;
  }

  static delete(id) {
    const index = reviews.findIndex(review => review.id === parseInt(id));
    if (index !== -1) {
      const deleted = reviews.splice(index, 1);
      return deleted[0];
    }
    return null;
  }

  static markHelpful(id) {
    const review = this.getById(id);
    if (review) {
      review.helpful += 1;
      return review;
    }
    return null;
  }

  static getAverageRating(menuItemId) {
    const itemReviews = this.getByMenuItemId(menuItemId);
    if (itemReviews.length === 0) return 0;
    
    const sum = itemReviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / itemReviews.length) * 10) / 10;
  }
}

module.exports = Review;
