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

// Opening hours utility for Rathbone
function getRathboneHours(now = new Date()) {
  // Times are in local Eastern time. We'll interpret using local server time.
  // Breakfast (Hot): 07:00–09:30 Mon–Sat; Brunch Sunday 11:00–13:00; Lunch 11:30–14:00 daily; Dinner 17:30–19:30 daily.
  const day = now.getDay(); // 0 Sun ... 6 Sat

  function todayWindow(label, startHH, startMM, endHH, endMM) {
    const start = new Date(now);
    start.setHours(startHH, startMM, 0, 0);
    const end = new Date(now);
    end.setHours(endHH, endMM, 0, 0);
    return { label, start, end };
  }

  // Sunday special: Brunch replaces Breakfast; keep Lunch, Dinner.
  let windows;
  if (day === 0) {
    windows = [
      todayWindow('Brunch', 11, 0, 13, 0),
      todayWindow('Dinner', 17, 30, 19, 30),
    ];
  } else {
    windows = [
      todayWindow('Breakfast', 7, 0, 9, 30),
      todayWindow('Lunch', 11, 30, 14, 0),
      todayWindow('Dinner', 17, 30, 19, 30),
    ];
  }

  const nowMs = now.getTime();
  const current = windows.find(w => nowMs >= w.start.getTime() && nowMs <= w.end.getTime());
  const upcoming = windows.find(w => nowMs < w.start.getTime());
  const next = current ? windows[windows.indexOf(current) + 1] || null : upcoming || null;
  const isOpen = !!current;
  return { isOpen, current, next, windows };
}

// Lightweight status endpoint for frontend
app.get('/api/hours/status', (req, res) => {
  const info = getRathboneHours(new Date());
  res.json({
    isOpen: info.isOpen,
    currentMeal: info.current ? info.current.label : null,
    nextMeal: info.next ? info.next.label : null,
    nextOpensAt: info.next ? info.next.start.toISOString() : null,
    todayWindows: info.windows.map(w => ({
      label: w.label,
      start: w.start.toISOString(),
      end: w.end.toISOString(),
    }))
  });
});

const PORT = process.env.PORT || 3001;

// Initialize database and start server
async function startServer() {
  // Start Express server first so non-DB routes (like hours) are available
  const server = app.listen(PORT, () => {
    console.log(`🦴 Boned API server is running on port ${PORT}`);
  });

  // Initialize database schema (non-fatal if it fails)
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

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
  } catch (error) {
    console.error('⚠ Database initialization failed:', error.message);
    console.error('Server is running but database-backed endpoints may be unavailable.');
  }
}

startServer();

module.exports = app;
