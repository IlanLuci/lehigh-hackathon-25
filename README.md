# 🦴 Boned - Rathbone Dining Reviews

A full-stack Progressive Web Application for rating and reviewing Lehigh University's Rathbone Dining Hall menu. Built with Node.js (Express) backend, React frontend, AWS RDS PostgreSQL database, and AWS S3 for image storage.

## Project Structure

```
lehigh-hackathon-25/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── serviceWorkerRegistration.js
│   │   └── reportWebVitals.js
│   ├── .gitignore
│   └── package.json
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure AWS services (see [AWS_SETUP.md](./AWS_SETUP.md)):
   - Set up AWS RDS PostgreSQL database
   - Create AWS S3 bucket for image storage
   - Configure IAM user with S3 permissions
   - Update `.env` with your AWS credentials and database details

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Features

### Core Functionality
- 🍽️ **Live Menu Scraping** - Automatically fetches daily menu from Sodexo API
- ⏰ **Dining Hours Status** - Shows whether Rathbone is open/closed with next meal times
- 🍳 **Meal Period Filtering** - Displays menu for current meal (breakfast, lunch, dinner)
- ⭐ **Ratings & Reviews** - Rate dishes 1-5 stars with optional comments
- 📸 **Photo Uploads** - Upload 1 photo per review (stored in AWS S3)
- 🏷️ **Smart Filtering** - Hides condiments, single vegetables, dressings, and non-food items
- 📊 **Station Grouping** - Items organized by dining station with entrees first
- 🎯 **Smart Sorting** - Stations sorted by best-reviewed entrees
- 👤 **Persistent User Names** - Username saved locally for future reviews

### Technical Stack
- ✅ Full-stack architecture (Node.js + React)
- ✅ **AWS RDS PostgreSQL** - Persistent database storage
- ✅ **AWS S3 (SDK v3)** - Scalable image hosting with default credential chain support
- ✅ Progressive Web App (PWA) capabilities
- ✅ Service Worker for offline functionality
- ✅ Express.js RESTful API with multipart file upload support
- ✅ React Router for navigation
- ✅ Axios for API communication
- ✅ CORS enabled
- ✅ **Puppeteer** - Headless browser for dynamic menu scraping
- ✅ **Multer** - File upload middleware
- ✅ **PostgreSQL** - Production-ready database with proper relations and indices

### Design
- 🎨 Lehigh University color scheme (Brown #6B4F1D, Gold #FFD700, Beige #E8E4D9)
- 🦴 Bone emoji branding
- 📱 Mobile-responsive design
- ♿ High contrast for readability

## API Endpoints

### Menu Items
- `GET /api/menu` - Get all available menu items
- `GET /api/menu/:id` - Get single menu item by ID
- `POST /api/menu/refresh` - Refresh menu from Rathbone/Sodexo website
- `POST /api/menu` - Create/update menu item (admin)
- `PUT /api/menu/:id` - Update menu item (admin)

### Reviews
- `GET /api/reviews/menu/:menuItemId` - Get all reviews for a menu item
- `POST /api/reviews` - Create new review (multipart/form-data with photos)
- `DELETE /api/reviews/:id` - Delete a review
- `PUT /api/reviews/:id/helpful` - Mark review as helpful

### Dining Hours
- `GET /api/hours/status` - Get current dining hall status, hours, and next meal info

## Architecture

### Database Schema
- **menu_items** - Menu items with ratings, station, category, dietary info
- **reviews** - User reviews with ratings, comments, and S3 photo URLs
- Foreign key relationships with cascade deletes
- Indices on frequently queried columns

### Backend Components
- **Models**
  - `MenuItem.db.js` - Database operations for menu items
  - `Review.db.js` - Database operations for reviews
  - `MenuScraper` - Service to fetch menu from Sodexo API with meal period tagging
- **Controllers**
  - `menuItem.controller.js` - Menu item business logic with camelCase field mapping
  - `review.controller.js` - Review business logic with S3 integration and field mapping
- **Config**
  - `database.js` - PostgreSQL connection pool and schema initialization with SSL support
  - `s3.js` - AWS S3 SDK v3 upload/delete helpers with default credential chain
- **Middleware**
  - `upload.js` - Multer configuration for multipart file uploads
- **Routes**
  - `menuItem.routes.js` - Menu item endpoints
  - `review.routes.js` - Review endpoints

### Frontend Components
- **Pages**
  - `Home.js` - Main menu display with station grouping, meal filtering, and open/closed status
- **Components**
  - `MenuItemCard` - Display menu item with ratings and pinned action buttons
  - `AddReviewForm` - Review submission with photo upload (1 photo max)
  - `ReviewCard` - Display individual review with photos and helpful button
  - `StarRating` - Interactive star rating component with numeric display
- **Services**
  - `api.js` - Axios instance with base configuration
  - `menuService.js` - API calls for menu items, reviews, and dining status

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Quick setup guide for AWS integration
- **[AWS_SETUP.md](./AWS_SETUP.md)** - Detailed AWS RDS and S3 setup instructions
- **[AWS_INTEGRATION.md](./AWS_INTEGRATION.md)** - Complete implementation summary
- **[MENU_INTEGRATION.md](./MENU_INTEGRATION.md)** - Menu scraping documentation
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Original project notes

## Menu Data

The application fetches menu items from the Rathbone Dining Hall via Sodexo API:
- **Live Scraping** - Puppeteer intercepts network requests for JSON data
- **Meal Period Tagging** - Items tagged with breakfast, lunch, or dinner for filtering
- **Stations** - Bliss, Grown, Mix, Savory, Showcase, Simple Servings, Sizzle, Slices
- **Smart Filtering** - Automatically hides condiments, dressings, single ingredients, non-food items
  - Excludes items like "Greek Vinaigrette", "Green Leaf Lettuce", "Sliced Plum Tomatoes"
- **Daily Updates** - Menu refreshes automatically on server start if database is empty
- **Manual Refresh** - Use `/api/menu/refresh` endpoint to force update
- **Persistence** - Menu stored in PostgreSQL with upsert logic, ratings preserved across refreshes
- **Dining Hours** - Backend provides current status and next meal times for UI display

## Development

- Backend runs on port 3001 by default
- Frontend runs on port 3000 by default
- Hot reloading enabled for both frontend and backend

## Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

## License

ISC
