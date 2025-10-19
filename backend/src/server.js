const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');
const MenuItem = require('./models/MenuItem.db');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Boned - Rathbone Dining Reviews' });
});

// Import routes
const menuItemRoutes = require('./routes/menuItem.routes');
const reviewRoutes = require('./routes/review.routes');

app.use('/api/menu', menuItemRoutes);
app.use('/api/reviews', reviewRoutes);

const PORT = process.env.PORT || 3001;

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database schema
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Start Express server
    app.listen(PORT, async () => {
      console.log(`🦴 Boned API server is running on port ${PORT}`);
      
      // Attempt to refresh menu on startup
      try {
        const items = await MenuItem.refreshMenuFromSource();
        if (items && items.length > 0) {
          console.log(`✓ Rathbone menu loaded: ${items.length} items`);
        } else {
          console.warn('⚠ Rathbone menu not loaded at startup (empty)');
        }
      } catch (err) {
        console.error('✗ Failed to load Rathbone menu on startup:', err.message);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
