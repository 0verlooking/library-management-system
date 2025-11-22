import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import loanService from '../services/loanService';
import userService from '../services/userService';
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

  // Стан для модальних вікон
  const [showBookModal, setShowBookModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Стан для форм
  const [bookForm, setBookForm] = useState({
    isbn: '',
    title: '',
    description: '',
    authors: '', // Буде розділено на firstName та lastName
    publisher: '',
    publishDate: '',
    pageCount: '',
    language: 'Українська',
    category: '',
    totalCopies: 1
  });

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'READER'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Обробники для форми книги
  const handleBookChange = (e) => {
    setBookForm({
      ...bookForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Перетворити authors з рядка "Ім'я Прізвище, Ім'я Прізвище" в масив AuthorDTO
      const authorsArray = bookForm.authors.split(',').map(authorName => {
        const parts = authorName.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        return {
          firstName: firstName,
          lastName: lastName,
          biography: null,
          birthDate: null,
          nationality: null
        };
      });

      // Створити CategoryDTO
      const categoryObj = {
        name: bookForm.category,
        description: null
      };

      const bookData = {
        isbn: bookForm.isbn,
        title: bookForm.title,
        description: bookForm.description || null,
        publishDate: bookForm.publishDate || null,
        publisher: bookForm.publisher,
        pageCount: bookForm.pageCount ? parseInt(bookForm.pageCount) : null,
        language: bookForm.language,
        totalCopies: parseInt(bookForm.totalCopies),
        availableCopies: parseInt(bookForm.totalCopies),
        status: 'AVAILABLE',
        authors: authorsArray,
        categories: [categoryObj]
      };

      await bookService.createBook(bookData);
      setSuccess('Книгу успішно додано!');

      // Очистити форму
      setBookForm({
        isbn: '',
        title: '',
        description: '',
        authors: '',
        publisher: '',
        publishDate: '',
        pageCount: '',
        language: 'Українська',
        category: '',
        totalCopies: 1
      });

      // Перезавантажити дані
      loadDashboardData();

      // Закрити модал через 2 секунди
      setTimeout(() => {
        setShowBookModal(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка при додаванні книги');
    }
  };

  // Обробники для форми користувача
  const handleUserChange = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // userForm вже має firstName та lastName
      await userService.createUser(userForm);
      setSuccess('Користувача успішно створено!');

      // Очистити форму
      setUserForm({
        username: '',
        password: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'READER'
      });

      // Закрити модал через 2 секунди
      setTimeout(() => {
        setShowUserModal(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка при створенні користувача');
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
          <button onClick={() => setShowBookModal(true)} className="action-btn primary">
            ➕ Додати книгу
          </button>
          <button onClick={() => setShowUserModal(true)} className="action-btn secondary">
            👥 Додати користувача
          </button>
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

      {/* Модальне вікно для додавання книги */}
      {showBookModal && (
        <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Додати нову книгу</h2>
              <button className="modal-close" onClick={() => setShowBookModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddBook} className="modal-form">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-group">
                <label>ISBN:</label>
                <input
                  type="text"
                  name="isbn"
                  value={bookForm.isbn}
                  onChange={handleBookChange}
                  required
                  placeholder="978-3-16-148410-0"
                />
              </div>

              <div className="form-group">
                <label>Назва книги:</label>
                <input
                  type="text"
                  name="title"
                  value={bookForm.title}
                  onChange={handleBookChange}
                  required
                  placeholder="Назва книги"
                />
              </div>

              <div className="form-group">
                <label>Опис (необов'язково):</label>
                <textarea
                  name="description"
                  value={bookForm.description}
                  onChange={handleBookChange}
                  rows="3"
                  placeholder="Короткий опис книги"
                />
              </div>

              <div className="form-group">
                <label>Автори (Ім'я Прізвище, через кому):</label>
                <input
                  type="text"
                  name="authors"
                  value={bookForm.authors}
                  onChange={handleBookChange}
                  required
                  placeholder="Тарас Шевченко, Іван Франко"
                />
              </div>

              <div className="form-group">
                <label>Видавництво:</label>
                <input
                  type="text"
                  name="publisher"
                  value={bookForm.publisher}
                  onChange={handleBookChange}
                  required
                  placeholder="А-БА-БА-ГА-ЛАМАГА"
                />
              </div>

              <div className="form-group">
                <label>Дата видання (необов'язково):</label>
                <input
                  type="date"
                  name="publishDate"
                  value={bookForm.publishDate}
                  onChange={handleBookChange}
                  placeholder="2024-01-01"
                />
              </div>

              <div className="form-group">
                <label>Кількість сторінок (необов'язково):</label>
                <input
                  type="number"
                  name="pageCount"
                  value={bookForm.pageCount}
                  onChange={handleBookChange}
                  min="1"
                  placeholder="256"
                />
              </div>

              <div className="form-group">
                <label>Мова:</label>
                <input
                  type="text"
                  name="language"
                  value={bookForm.language}
                  onChange={handleBookChange}
                  required
                  placeholder="Українська"
                />
              </div>

              <div className="form-group">
                <label>Категорія:</label>
                <input
                  type="text"
                  name="category"
                  value={bookForm.category}
                  onChange={handleBookChange}
                  required
                  placeholder="Художня література"
                />
              </div>

              <div className="form-group">
                <label>Кількість копій:</label>
                <input
                  type="number"
                  name="totalCopies"
                  value={bookForm.totalCopies}
                  onChange={handleBookChange}
                  required
                  min="1"
                  placeholder="3"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">Додати книгу</button>
                <button type="button" className="btn-secondary" onClick={() => setShowBookModal(false)}>
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальне вікно для додавання користувача */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👥 Додати нового користувача</h2>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddUser} className="modal-form">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-group">
                <label>Ім'я користувача:</label>
                <input
                  type="text"
                  name="username"
                  value={userForm.username}
                  onChange={handleUserChange}
                  required
                  placeholder="username"
                />
              </div>

              <div className="form-group">
                <label>Пароль:</label>
                <input
                  type="password"
                  name="password"
                  value={userForm.password}
                  onChange={handleUserChange}
                  required
                  minLength="6"
                  placeholder="Мінімум 6 символів"
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={userForm.email}
                  onChange={handleUserChange}
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className="form-group">
                <label>Ім'я:</label>
                <input
                  type="text"
                  name="firstName"
                  value={userForm.firstName}
                  onChange={handleUserChange}
                  required
                  placeholder="Іван"
                />
              </div>

              <div className="form-group">
                <label>Прізвище:</label>
                <input
                  type="text"
                  name="lastName"
                  value={userForm.lastName}
                  onChange={handleUserChange}
                  required
                  placeholder="Іванов"
                />
              </div>

              <div className="form-group">
                <label>Роль:</label>
                <select
                  name="role"
                  value={userForm.role}
                  onChange={handleUserChange}
                  required
                >
                  <option value="READER">Читач (READER)</option>
                  <option value="LIBRARIAN">Бібліотекар (LIBRARIAN)</option>
                  <option value="ADMIN">Адміністратор (ADMIN)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">Створити користувача</button>
                <button type="button" className="btn-secondary" onClick={() => setShowUserModal(false)}>
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
