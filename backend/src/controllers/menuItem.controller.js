const MenuItem = require('../models/MenuItem.db');

// Get all menu items
const getAllMenuItems = async (req, res) => {
  try {
    // If database is empty, try to refresh from source
    const isEmpty = await MenuItem.isEmpty();
    if (isEmpty) {
      const refreshed = await MenuItem.refreshMenuFromSource();
      if (!refreshed || refreshed.length === 0) {
        return res.status(503).json({ 
          message: 'Rathbone menu is currently unavailable. Please try again later.'
        });
      }
    }

    const items = await MenuItem.getAll();
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(503).json({ message: 'Failed to load Rathbone menu', error: error.message });
  }
};

// Get single menu item by ID
const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ message: 'Error fetching menu item', error: error.message });
  }
};

// Create new menu item (admin function)
const createMenuItem = async (req, res) => {
  try {
    const newItem = await MenuItem.upsert(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Error creating menu item', error: error.message });
  }
};

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    const updated = await MenuItem.upsert({ id: req.params.id, ...req.body });
    if (!updated) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Error updating menu item', error: error.message });
  }
};

  // Refresh menu from Rathbone website
  const refreshMenu = async (req, res) => {
    try {
      const updatedMenu = await MenuItem.refreshMenuFromSource();
      if (!updatedMenu) {
        return res.status(500).json({ message: 'Failed to refresh menu' });
      }
      res.json({ 
        message: 'Menu refreshed successfully', 
        itemCount: updatedMenu.length,
        items: updatedMenu 
      });
    } catch (error) {
      console.error('Error refreshing menu:', error);
      res.status(500).json({ message: 'Error refreshing menu', error: error.message });
    }
  };

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
    updateMenuItem,
    refreshMenu
};
