import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import loanService from '../services/loanService';
import './Dashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    activeLoans: 0,
    overdueLoans: 0
  });
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [booksRes, availableRes, loansRes, overdueRes] = await Promise.all([
        bookService.getAllBooks(),
        bookService.getAvailableBooks(),
        loanService.getAllLoans(),
        loanService.getOverdueLoans()
      ]);

      setStats({
        totalBooks: booksRes.data.length,
        availableBooks: availableRes.data.length,
        activeLoans: loansRes.data.filter(l => l.status === 'ACTIVE').length,
        overdueLoans: overdueRes.data.length
      });

      // Останні 5 книг
      setRecentBooks(booksRes.data.slice(0, 5));
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
        <h1>👨‍💼 Панель Адміністратора</h1>
        <p>Повне керування системою бібліотеки</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card books">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>{stats.totalBooks}</h3>
            <p>Всього книг</p>
          </div>
        </div>

        <div className="stat-card available">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.availableBooks}</h3>
            <p>Доступно</p>
          </div>
        </div>

        <div className="stat-card loans">
          <div className="stat-icon">📖</div>
          <div className="stat-info">
            <h3>{stats.activeLoans}</h3>
            <p>Активні позики</p>
          </div>
        </div>

        <div className="stat-card overdue">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{stats.overdueLoans}</h3>
            <p>Прострочені</p>
          </div>
        </div>
      </div>

      <div className="actions-section">
        <h2>🎯 Швидкі дії</h2>
        <div className="action-buttons">
          <Link to="/admin/books" className="action-btn primary">
            ➕ Додати книгу
          </Link>
          <Link to="/admin/users" className="action-btn secondary">
            👥 Керувати користувачами
          </Link>
          <Link to="/books" className="action-btn info">
            📚 Каталог книг
          </Link>
          <Link to="/loans" className="action-btn warning">
            📋 Всі позики
          </Link>
        </div>
      </div>

      <div className="recent-section">
        <h2>📖 Останні книги в каталозі</h2>
        <div className="recent-list">
          {recentBooks.map(book => (
            <div key={book.id} className="recent-item">
              <div className="recent-info">
                <h4>{book.title}</h4>
                <p>{book.authors?.join(', ')}</p>
              </div>
              <div className="recent-status">
                <span className={book.availableCopies > 0 ? 'badge success' : 'badge danger'}>
                  {book.availableCopies > 0 ? 'Доступна' : 'Видана'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
