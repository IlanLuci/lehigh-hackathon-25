# Lehigh Hackathon 2025

A full-stack Progressive Web Application built with Node.js (Express) backend and React frontend.

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

4. Start the development server:
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

- ✅ Full-stack architecture (Node.js + React)
- ✅ Progressive Web App (PWA) capabilities
- ✅ Service Worker for offline functionality
- ✅ Express.js RESTful API
- ✅ React Router for navigation
- ✅ Axios for API communication
- ✅ CORS enabled
- ✅ **Rathbone Menu Integration** - Pulls menu from Lehigh Rathbone Dining Hall

## API Endpoints

### Menu Items
- `POST /api/menu/refresh` - Refresh menu from Rathbone website

### Reviews

## Component Structure

### Frontend Components

### Backend Models
- **MenuScraper** - Service to fetch menu from Rathbone Dining Hall website

## Menu Data

The application fetches menu items from the Rathbone Dining Hall website. See [MENU_INTEGRATION.md](./MENU_INTEGRATION.md) for details on:
- How menu scraping works
- Available food stations (Grill, Globowl, Wok, Pizza, Pasta, etc.)
- Dietary information tags (Vegetarian, Vegan, Gluten-Free, Halal, etc.)
- Manual menu refresh endpoint
- Future enhancement options

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
