import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>Boned &mdash; Lehigh University Dining Reviews</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
