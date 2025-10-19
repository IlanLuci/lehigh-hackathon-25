const { pool } = require('../config/database');

class MenuItem {
  /**
   * Get all menu items
   */
  static async getAll() {
    const result = await pool.query(`
      SELECT * FROM menu_items 
      WHERE available = true 
      ORDER BY station, name
    `);
    return result.rows;
  }

  /**
   * Get menu item by ID
   */
  static async getById(id) {
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Create or update menu item (upsert)
   */
  static async upsert(itemData) {
    const {
      name,
      description = '',
      station = 'Main',
      category = 'Entree',
      dietaryInfo = [],
      available = true,
    } = itemData;

    const result = await pool.query(
      `INSERT INTO menu_items (name, description, station, category, dietary_info, available)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (name, station) 
       DO UPDATE SET
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         dietary_info = EXCLUDED.dietary_info,
         available = EXCLUDED.available,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [name, description, station, category, JSON.stringify(dietaryInfo), available]
    );

    return result.rows[0];
  }

  /**
   * Update menu item rating
   */
  static async updateRating(id, newRating, reviewCount) {
    const result = await pool.query(
      `UPDATE menu_items 
       SET average_rating = $1, total_reviews = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [newRating, reviewCount, id]
    );
    return result.rows[0];
  }

  /**
   * Check if menu items table is empty
   */
  static async isEmpty() {
    const result = await pool.query('SELECT COUNT(*) as count FROM menu_items');
    return parseInt(result.rows[0].count) === 0;
  }

  /**
   * Refresh menu from source (scraper)
   */
  static async refreshMenuFromSource() {
    try {
      const { fetchRathboneMenu } = require('../services/menuScraper');
      const freshMenu = await fetchRathboneMenu();

      // Mark all existing items as unavailable
      await pool.query('UPDATE menu_items SET available = false');

      // Upsert all fresh menu items
      const upsertPromises = freshMenu.map(item => this.upsert({ ...item, available: true }));
      await Promise.all(upsertPromises);

      // Get final count
      const result = await pool.query('SELECT COUNT(*) as count FROM menu_items WHERE available = true');
      return freshMenu;
    } catch (error) {
      console.error('Error refreshing menu:', error);
      throw error;
    }
  }

  /**
   * Delete old unavailable items (cleanup)
   */
  static async cleanupOldItems(daysOld = 7) {
    const result = await pool.query(
      `DELETE FROM menu_items 
       WHERE available = false 
       AND updated_at < NOW() - INTERVAL '${daysOld} days'`
    );
    return result.rowCount;
  }
}

module.exports = MenuItem;
