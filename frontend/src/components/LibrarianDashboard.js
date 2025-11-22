import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import loanService from '../services/loanService';
import bookService from '../services/bookService';
import './Dashboard.css';

function LibrarianDashboard() {
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [overdueRes, loansRes, booksRes] = await Promise.all([
        loanService.getOverdueLoans(),
        loanService.getAllLoans(),
        bookService.getAllBooks()
      ]);

      setOverdueLoans(overdueRes.data);
      setActiveLoans(loansRes.data.filter(l => l.status === 'ACTIVE'));

      // Книги з малою кількістю копій
      const low = booksRes.data.filter(b => b.availableCopies <= 1 && b.totalCopies > 0);
      setLowStock(low);

      setLoading(false);
    } catch (err) {
      console.error('Помилка завантаження:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-container"><div className="loading">Завантаження...</div></div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📚 Панель Бібліотекаря</h1>
        <p>Керування книгами та відстеження позик</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{overdueLoans.length}</h3>
            <p>Прострочені позики</p>
          </div>
        </div>

        <div className="stat-card loans">
          <div className="stat-icon">📖</div>
          <div className="stat-info">
            <h3>{activeLoans.length}</h3>
            <p>Активні позики</p>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{lowStock.length}</h3>
            <p>Мало копій</p>
          </div>
        </div>
      </div>

      <div className="actions-section">
        <h2>🎯 Швидкі дії</h2>
        <div className="action-buttons">
          <Link to="/librarian/books" className="action-btn primary">
            ➕ Додати книгу
          </Link>
          <Link to="/books" className="action-btn info">
            📚 Каталог книг
          </Link>
          <Link to="/loans" className="action-btn warning">
            📋 Всі позики
          </Link>
        </div>
      </div>

      {overdueLoans.length > 0 && (
        <div className="alert-section">
          <h2>⚠️ УВАГА! Прострочені позики ({overdueLoans.length})</h2>
          <div className="alert-list">
            {overdueLoans.slice(0, 5).map(loan => (
              <div key={loan.id} className="alert-item">
                <div className="alert-info">
                  <h4>{loan.bookTitle}</h4>
                  <p>Користувач: {loan.userName || loan.userId}</p>
                  <p>Мала бути повернута: {new Date(loan.dueDate).toLocaleDateString('uk-UA')}</p>
                </div>
                <div className="alert-badge">
                  <span className="badge danger">Прострочено</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="recent-section">
          <h2>📦 Книги з малою кількістю копій</h2>
          <div className="recent-list">
            {lowStock.map(book => (
              <div key={book.id} className="recent-item">
                <div className="recent-info">
                  <h4>{book.title}</h4>
                  <p>{book.authors?.join(', ')}</p>
                </div>
                <div className="recent-status">
                  <span className="badge warning">
                    {book.availableCopies} з {book.totalCopies}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LibrarianDashboard;
