# Rathbone Menu Integration

## Overview

This application now pulls menu data from the Lehigh Rathbone Dining Hall website at:
`https://lehigh.sodexomyway.com/en-us/locations/rathbone-dining-hall`

## How It Works

### Menu Scraper Service

The `menuScraper.js` service (`backend/src/services/menuScraper.js`) handles fetching menu data from the Rathbone website.

**Features:**
- Attempts to scrape menu items from the Sodexo website
- Falls back to sample Rathbone menu data if scraping fails
- Extracts dietary information (Vegetarian, Vegan, Gluten-Free, etc.)
- Categorizes items automatically (Entree, Pizza, Salad, etc.)
- Identifies food stations (Grill, Globowl, Wok Station, etc.)

### Current Implementation

Since the Sodexo website loads menu data dynamically via JavaScript, the current implementation:

1. **Attempts web scraping** using Cheerio and Axios
2. **Tries API endpoints** that Sodexo might expose
3. **Falls back to sample data** that represents typical Rathbone offerings

### Sample Menu Data

The application includes 16 sample menu items representing actual Rathbone stations:

- **Grill Station**: Grilled Chicken, Salmon, Veggie Burger
- **Pizza Station**: Margherita Pizza
- **Globowl Station**: Halal Chicken Shawarma, Beef Tacos, Grain Bowls
- **Wok Station**: Vegetable Stir Fry
- **Salad Bar**: Caesar Salad, Fresh Fruit
- **Pasta Station**: Pasta Primavera
- **Simple Servings**: Scrambled Eggs (allergy-friendly)
- **Bakery**: Chocolate Chip Cookies
- **Breakfast Items**: Pancakes, Scrambled Eggs

## API Endpoints

### Refresh Menu Data

You can manually refresh the menu from the Rathbone website:

```bash
POST http://localhost:3001/api/menu/refresh
```

**Response:**
```json
{
  "message": "Menu refreshed successfully",
  "itemCount": 16,
  "items": [...]
}
```

This endpoint:
- Fetches fresh menu data from the Rathbone website
- Preserves existing ratings and reviews for items that remain on the menu
- Returns the updated menu list

## Future Enhancements

### Option 1: Sodexo API Access

If Lehigh provides API access to Sodexo menu data, update the `fetchFromSodexoAPI()` function with:
- Correct API endpoint
- Authentication tokens if needed
- Proper date formatting

### Option 2: Scheduled Updates

The app includes `node-cron` for scheduled menu updates. To enable automatic daily updates:

```javascript
// In server.js
const cron = require('node-cron');
const MenuItem = require('./models/MenuItem');

// Refresh menu daily at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Refreshing Rathbone menu...');
  await MenuItem.refreshMenuFromSource();
});
```

### Option 3: Manual Menu Management

Admins can add/update menu items via:

```bash
POST http://localhost:3001/api/menu
Content-Type: application/json

{
  "name": "New Dish Name",
  "category": "Entree",
  "station": "Grill",
  "description": "Description of the dish",
  "dietaryInfo": ["Vegetarian", "Gluten-Free"]
}
```

## Dietary Information Tags

The system recognizes and displays:
- 🌱 Vegetarian
- 🌿 Vegan
- 🌾 Gluten-Free
- 🥛 Dairy-Free
- ☪️ Halal
- 💪 High Protein
- 🎨 Customizable

## Rathbone Stations

The app includes menu items from all major Rathbone stations:
- **Grill** - Burgers, chicken, fish
- **Pizza Station** - Various pizza options
- **Globowl** - International cuisine and Halal options
- **Wok Station** - Asian stir-fry dishes
- **Pasta Station** - Fresh pasta dishes
- **Salad Bar** - Fresh salads and fruits
- **Simple Servings** - Allergy-friendly options
- **Soup Station** - Daily soups
- **Bakery** - Fresh baked goods

## Notes

The Sodexo website uses dynamic JavaScript rendering, which makes traditional web scraping challenging. For production use, consider:

1. Contacting Lehigh Dining Services for API access
2. Using a headless browser (Puppeteer) for JavaScript rendering
3. Manually updating the menu database regularly
4. Allowing students to report when menu items are available
