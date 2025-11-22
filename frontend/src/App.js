import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import BookList from './components/BookList';
import LoanList from './components/LoanList';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import LibrarianDashboard from './components/LibrarianDashboard';
import ReaderDashboard from './components/ReaderDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import authService from './services/authService';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Завантажити інформацію про поточного користувача
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    window.location.href = '/login';
  };

  // Функція для отримання правильного dashboard в залежності від ролі
  const getDashboard = () => {
    if (currentUser?.role === 'ADMIN') {
      return <AdminDashboard />;
    } else if (currentUser?.role === 'LIBRARIAN') {
      return <LibrarianDashboard />;
    } else {
      return <ReaderDashboard />;
    }
  };

  // Отримати іконку для ролі
  const getRoleIcon = () => {
    if (currentUser?.role === 'ADMIN') return '👑';
    if (currentUser?.role === 'LIBRARIAN') return '📋';
    return '👤';
  };

  // Якщо користувач не автентифікований, показати тільки Login
  if (!authService.isAuthenticated()) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">📚 Бібліотека</h1>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">{getRoleIcon()} Головна</Link>
              </li>
              <li className="nav-item">
                <Link to="/books" className="nav-link">📖 Каталог</Link>
              </li>
              <li className="nav-item">
                <Link to="/loans" className="nav-link">📋 Позики</Link>
              </li>
              <li className="nav-item nav-user-info">
                <span className="user-name">
                  {getRoleIcon()} {currentUser?.username} ({currentUser?.role})
                </span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="logout-button">
                  Вийти
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {getDashboard()}
                </ProtectedRoute>
              }
            />
            <Route
              path="/books"
              element={
                <ProtectedRoute>
                  <BookList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/loans"
              element={
                <ProtectedRoute>
                  <LoanList />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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
