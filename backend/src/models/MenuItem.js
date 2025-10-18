// In-memory data store for menu items
// In production, this would be replaced with a database

// Initialize with empty list; will be populated via refresh from source
let menuItems = [];

class MenuItem {
  static getAll() {
    return menuItems.map((item, index) => ({
      ...item,
      id: index + 1
    }));
  }

  static getById(id) {
    return menuItems.find(item => item.id === parseInt(id));
  }

  static create(itemData) {
    const newItem = {
      id: menuItems.length > 0 ? Math.max(...menuItems.map(i => i.id)) + 1 : 1,
      ...itemData,
      averageRating: 0,
      totalReviews: 0,
      available: true
    };
    menuItems.push(newItem);
    return newItem;
  }

  static update(id, updates) {
    const index = menuItems.findIndex(item => item.id === parseInt(id));
    if (index !== -1) {
      menuItems[index] = { ...menuItems[index], ...updates };
      return menuItems[index];
    }
    return null;
  }

  static updateRating(id, newRating, reviewCount) {
    const item = this.getById(id);
    if (item) {
      item.averageRating = newRating;
      item.totalReviews = reviewCount;
      return item;
    }
    return null;
  }

  static isEmpty() {
    return !menuItems || menuItems.length === 0;
  }

    static async refreshMenuFromSource() {
      try {
        const { fetchRathboneMenu } = require('../services/menuScraper');
        const freshMenu = await fetchRathboneMenu();
      
        // Preserve existing ratings and reviews when refreshing
        menuItems = freshMenu.map((newItem, index) => {
          const existingItem = menuItems.find(item => 
            item.name.toLowerCase() === newItem.name.toLowerCase()
          );
        
          return {
            ...newItem,
            id: index + 1,
            averageRating: existingItem ? existingItem.averageRating : 0,
            totalReviews: existingItem ? existingItem.totalReviews : 0
          };
        });
      
        return menuItems;
      } catch (error) {
        console.error('Error refreshing menu:', error);
        return null;
      }
    }
}

module.exports = MenuItem;
