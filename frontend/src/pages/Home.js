import React, { useState, useEffect } from 'react';
import MenuItemCard from '../components/MenuItemCard/MenuItemCard';
import { getAllMenuItems } from '../services/menuService';
import '../styles/Home.css';

const Home = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError('');
      const items = await getAllMenuItems();
      setMenuItems(items);
    } catch (err) {
      // Try to surface server-provided message if present
      const serverMsg = err?.response?.data?.message;
      setError(serverMsg || 'Failed to load menu items. Please try again later.');
      console.error('Error loading menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];


  // Group items by station
  const groupedByStation = {};
  menuItems.forEach(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return;
    const station = item.station || 'Other';
    if (!groupedByStation[station]) groupedByStation[station] = [];
    groupedByStation[station].push(item);
  });

  // Sort items within each station
  Object.keys(groupedByStation).forEach(station => {
    groupedByStation[station].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'reviews':
          return b.totalReviews - a.totalReviews;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  });


  // Helper to render a station group, with entrees sorted by rating first
  const renderStationGroup = (station, items) => {
    const entrees = items
      .filter(i => i.category === 'Entree')
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    const others = items.filter(i => i.category !== 'Entree');
    const displayStation = station === 'Bliss' ? 'Dessert' : station;
    return (
      <div key={station} className="station-group">
        <h2 className="station-header">{displayStation}</h2>
        <div className="menu-items-grid">
          {/* Entrees first, sorted by rating */}
          {entrees.map(item => (
            <MenuItemCard key={item.id} item={item} />
          ))}
          {/* Other categories */}
          {others.map(item => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading menu items...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={loadMenuItems} style={{ marginTop: 12 }}>
          Retry Fetch
        </button>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="page-header" style={{marginBottom: 12}}>
        <h1 style={{fontSize: '2.5rem', marginBottom: 4, textShadow: 'none'}}>🦴 Boned</h1>
        <p className="subtitle" style={{fontSize: '1rem', marginBottom: 0}}>Rate, review, and share your Rathbone dining experience!</p>
      </header>

      <div className="controls">
        <div className="filter-group">
          <label>Filter by Category:</label>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="name">Name (A-Z)</option>
            <option value="rating">Highest Rating</option>
            <option value="reviews">Most Reviews</option>
          </select>
        </div>
      </div>

      {/* Render all items grouped by station, sorted by best reviewed entree, Dessert at the bottom */}
      {(() => {
        const entries = Object.entries(groupedByStation);
        // Separate dessert
        const nonDessert = entries.filter(([station]) => station !== 'Bliss');
        const dessert = entries.filter(([station]) => station === 'Bliss');
        // Sort non-dessert stations by best average rating of their entrees
        nonDessert.sort((a, b) => {
          const bestA = Math.max(...a[1].filter(i => i.category === 'Entree').map(i => i.averageRating || 0), 0);
          const bestB = Math.max(...b[1].filter(i => i.category === 'Entree').map(i => i.averageRating || 0), 0);
          return bestB - bestA;
        });
        return [
          ...nonDessert.map(([station, items]) => renderStationGroup(station, items)),
          ...dessert.map(([station, items]) => renderStationGroup(station, items))
        ];
      })()}
    </div>
  );
};

export default Home;
