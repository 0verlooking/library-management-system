import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookList from './components/BookList';
import LoanList from './components/LoanList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">Бібліотека</h1>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">Каталог книг</Link>
              </li>
              <li className="nav-item">
                <Link to="/loans" className="nav-link">Позики</Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<BookList />} />
            <Route path="/loans" element={<LoanList />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2025 Система керування бібліотекою</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
