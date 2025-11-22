import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import loanService from '../services/loanService';
import authService from '../services/authService';
import './Dashboard.css';

function ReaderDashboard() {
  const [myLoans, setMyLoans] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [loansRes, booksRes] = await Promise.all([
        loanService.getAllLoans(),
        bookService.getAvailableBooks()
      ]);

      // Фільтруємо позики поточного користувача
      const userLoans = loansRes.data.filter(
        loan => loan.userId === currentUser.id && loan.status === 'ACTIVE'
      );
      setMyLoans(userLoans);

      // Показуємо тільки доступні книги
      setAvailableBooks(booksRes.data.slice(0, 6));
      setLoading(false);
    } catch (err) {
      console.error('Помилка завантаження:', err);
      setLoading(false);
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div className="dashboard-container"><div className="loading">Завантаження...</div></div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👤 Мій Кабінет Читача</h1>
        <p>Вітаємо, {currentUser?.username}!</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card loans">
          <div className="stat-icon">📖</div>
          <div className="stat-info">
            <h3>{myLoans.length}</h3>
            <p>Мої активні позики</p>
          </div>
        </div>

        <div className="stat-card available">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{availableBooks.length}</h3>
            <p>Доступно книг</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>{5 - myLoans.length}</h3>
            <p>Можу взяти ще</p>
          </div>
        </div>
      </div>

      <div className="actions-section">
        <h2>🎯 Швидкі дії</h2>
        <div className="action-buttons">
          <Link to="/books" className="action-btn primary">
            🔍 Переглянути каталог
          </Link>
          <Link to="/loans" className="action-btn info">
            📋 Мої позики
          </Link>
        </div>
      </div>

      {myLoans.length > 0 && (
        <div className="alert-section">
          <h2>📖 Мої взяті книги ({myLoans.length})</h2>
          <div className="alert-list">
            {myLoans.map(loan => {
              const daysLeft = getDaysUntilDue(loan.dueDate);
              const isOverdue = daysLeft < 0;
              const isDueSoon = daysLeft >= 0 && daysLeft <= 3;

              return (
                <div key={loan.id} className="alert-item">
                  <div className="alert-info">
                    <h4>{loan.bookTitle}</h4>
                    <p>Взято: {new Date(loan.loanDate).toLocaleDateString('uk-UA')}</p>
                    <p>
                      Повернути до: {new Date(loan.dueDate).toLocaleDateString('uk-UA')}
                      {isOverdue && <strong className="text-danger"> (ПРОСТРОЧЕНО!)</strong>}
                      {isDueSoon && <strong className="text-warning"> (залишилось {daysLeft} дн.)</strong>}
                    </p>
                  </div>
                  <div className="alert-badge">
                    <span className={`badge ${isOverdue ? 'danger' : isDueSoon ? 'warning' : 'success'}`}>
                      {isOverdue ? 'Прострочено' : isDueSoon ? 'Треба повернути' : `${daysLeft} днів`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="recent-section">
        <h2>✨ Доступні книги для позики</h2>
        <div className="books-grid">
          {availableBooks.map(book => (
            <div key={book.id} className="book-card">
              <h4>{book.title}</h4>
              <p className="book-author">{book.authors?.join(', ')}</p>
              <p className="book-copies">Доступно копій: {book.availableCopies}</p>
              <span className="badge success">Можна взяти</span>
            </div>
          ))}
        </div>
        <div className="view-all">
          <Link to="/books" className="link-btn">Переглянути всі книги →</Link>
        </div>
      </div>
    </div>
  );
}

export default ReaderDashboard;
