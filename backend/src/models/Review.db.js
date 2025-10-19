const { pool } = require('../config/database');

class Review {
  /**
   * Get all reviews for a menu item
   */
  static async getByMenuItem(menuItemId) {
    const result = await pool.query(
      `SELECT * FROM reviews 
       WHERE menu_item_id = $1 
       ORDER BY created_at DESC`,
      [menuItemId]
    );
    return result.rows;
  }

  /**
   * Create a new review
   */
  static async create(reviewData) {
    const {
      menuItemId,
      userName = 'Anonymous',
      rating,
      comment = '',
      photos = [],
    } = reviewData;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const result = await pool.query(
      `INSERT INTO reviews (menu_item_id, user_name, rating, comment, photos)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [menuItemId, userName, rating, comment, JSON.stringify(photos)]
    );

    return result.rows[0];
  }

  /**
   * Delete a review
   */
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Mark review as helpful
   */
  static async markHelpful(id) {
    const result = await pool.query(
      `UPDATE reviews 
       SET helpful_count = helpful_count + 1 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Calculate average rating for a menu item
   */
  static async calculateAverageRating(menuItemId) {
    const result = await pool.query(
      `SELECT 
         COALESCE(AVG(rating), 0) as average_rating,
         COUNT(*) as total_reviews
       FROM reviews 
       WHERE menu_item_id = $1`,
      [menuItemId]
    );

    return {
      averageRating: parseFloat(result.rows[0].average_rating).toFixed(2),
      totalReviews: parseInt(result.rows[0].total_reviews),
    };
  }

  /**
   * Get recent reviews (all menu items)
   */
  static async getRecent(limit = 10) {
    const result = await pool.query(
      `SELECT r.*, m.name as menu_item_name, m.station
       FROM reviews r
       JOIN menu_items m ON r.menu_item_id = m.id
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

module.exports = Review;
