const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Lehigh Hackathon 2025 API' });
});

// Import routes
const menuItemRoutes = require('./routes/menuItem.routes');
const reviewRoutes = require('./routes/review.routes');
const MenuItem = require('./models/MenuItem');

app.use('/api/menu', menuItemRoutes);
app.use('/api/reviews', reviewRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Attempt to refresh menu on startup
  MenuItem.refreshMenuFromSource()
    .then(items => {
      if (items && items.length > 0) {
        console.log(`Rathbone menu loaded: ${items.length} items.`);
      } else {
        console.warn('Rathbone menu not loaded at startup (empty).');
      }
    })
    .catch(err => {
      console.error('Failed to load Rathbone menu on startup:', err.message);
    });
});

module.exports = app;
