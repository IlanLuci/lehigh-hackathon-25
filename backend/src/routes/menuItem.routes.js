const express = require('express');
const router = express.Router();
const {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  refreshMenu
} = require('../controllers/menuItem.controller');

// GET /api/menu - Get all menu items
router.get('/', getAllMenuItems);

// POST /api/menu/refresh - Refresh menu from Rathbone website
router.post('/refresh', refreshMenu);

// GET /api/menu/:id - Get single menu item
router.get('/:id', getMenuItemById);

// POST /api/menu - Create new menu item
router.post('/', createMenuItem);

// PUT /api/menu/:id - Update menu item
router.put('/:id', updateMenuItem);

module.exports = router;
