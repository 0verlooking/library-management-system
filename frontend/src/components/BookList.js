import React, { useState, useEffect } from 'react';
import bookService from '../services/bookService';
import authService from '../services/authService';
import './BookList.css';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Модальні вікна
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Форма редагування
  const [editForm, setEditForm] = useState({
    isbn: '',
    title: '',
    description: '',
    authors: '',
    publisher: '',
    publishDate: '',
    pageCount: '',
    language: '',
    category: '',
    totalCopies: 0
  });

  // Перевірка ролі користувача
  const currentUser = authService.getCurrentUser();
  const canEdit = authService.isAdmin() || authService.isLibrarian();
  const canDelete = authService.isAdmin();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookService.getAllBooks();
      setBooks(response.data);
    } catch (err) {
      setError('Помилка завантаження книг');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchBooks();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let response;
      if (searchType === 'title') {
        response = await bookService.searchByTitle(searchTerm);
      } else if (searchType === 'author') {
        response = await bookService.searchByAuthor(searchTerm);
      } else if (searchType === 'category') {
        response = await bookService.searchByCategory(searchTerm);
      }
      setBooks(response.data);
    } catch (err) {
      setError('Помилка пошуку');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Відкрити модал редагування
  const handleEditClick = (book) => {
    setSelectedBook(book);

    // Заповнити форму даними книги
    setEditForm({
      isbn: book.isbn || '',
      title: book.title || '',
      description: book.description || '',
      authors: book.authors ? book.authors.map(a => `${a.firstName} ${a.lastName}`).join(', ') : '',
      publisher: book.publisher || '',
      publishDate: book.publishDate || '',
      pageCount: book.pageCount || '',
      language: book.language || '',
      category: book.categories && book.categories.length > 0 ? book.categories[0].name : '',
      totalCopies: book.totalCopies || 0
    });

    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  // Обробка зміни полів форми
  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  // Зберегти зміни
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Перетворити authors в масив AuthorDTO
      const authorsArray = editForm.authors.split(',').map(authorName => {
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
        name: editForm.category,
        description: null
      };

      const bookData = {
        id: selectedBook.id,
        isbn: editForm.isbn,
        title: editForm.title,
        description: editForm.description || null,
        publishDate: editForm.publishDate || null,
        publisher: editForm.publisher,
        pageCount: editForm.pageCount ? parseInt(editForm.pageCount) : null,
        language: editForm.language,
        totalCopies: parseInt(editForm.totalCopies),
        availableCopies: selectedBook.availableCopies, // Зберігаємо поточну кількість
        status: selectedBook.status,
        authors: authorsArray,
        categories: [categoryObj]
      };

      await bookService.updateBook(selectedBook.id, bookData);
      setSuccess('Книгу успішно оновлено!');

      // Оновити список
      fetchBooks();

      // Закрити модал через 2 секунди
      setTimeout(() => {
        setShowEditModal(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка при оновленні книги');
    }
  };

  // Відкрити модал видалення
  const handleDeleteClick = (book) => {
    setSelectedBook(book);
    setShowDeleteModal(true);
    setError('');
  };

  // Підтвердити видалення
  const handleConfirmDelete = async () => {
    try {
      await bookService.deleteBook(selectedBook.id);
      setSuccess('Книгу успішно видалено!');
      setShowDeleteModal(false);

      // Оновити список
      fetchBooks();

      // Очистити повідомлення через 3 секунди
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка при видаленні книги');
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="book-list-container">
      <h1>📚 Каталог книг</h1>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="search-type"
        >
          <option value="title">Назва</option>
          <option value="author">Автор</option>
          <option value="category">Категорія</option>
        </select>

        <input
          type="text"
          placeholder="Пошук книг..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="search-input"
        />

        <button onClick={handleSearch} className="search-button">
          🔍 Пошук
        </button>

        <button onClick={fetchBooks} className="reset-button">
          🔄 Скинути
        </button>
      </div>

      {loading && <div className="loading">Завантаження...</div>}

      <div className="books-grid">
        {books.map((book) => (
          <div key={book.id} className="book-card">
            <h3>{book.title}</h3>
            <p><strong>ISBN:</strong> {book.isbn}</p>
            {book.authors && book.authors.length > 0 && (
              <p><strong>Автори:</strong> {book.authors.map(a => `${a.firstName} ${a.lastName}`).join(', ')}</p>
            )}
            {book.publisher && <p><strong>Видавництво:</strong> {book.publisher}</p>}
            {book.publishDate && <p><strong>Рік:</strong> {new Date(book.publishDate).getFullYear()}</p>}
            {book.description && <p className="book-description"><strong>Опис:</strong> {book.description}</p>}
            <p><strong>Доступно:</strong> {book.availableCopies} з {book.totalCopies}</p>
            <p className={`status ${book.status.toLowerCase()}`}>
              <strong>Статус:</strong> {book.status === 'AVAILABLE' ? 'Доступна' : 'Недоступна'}
            </p>

            {/* Кнопки для адміна та бібліотекаря */}
            {canEdit && (
              <div className="book-actions">
                <button onClick={() => handleEditClick(book)} className="btn-edit">
                  ✏️ Редагувати
                </button>
                {canDelete && (
                  <button onClick={() => handleDeleteClick(book)} className="btn-delete">
                    🗑️ Видалити
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {books.length === 0 && !loading && (
        <div className="no-results">Книги не знайдено</div>
      )}

      {/* Модальне вікно редагування */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Редагувати книгу</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-group">
                <label>ISBN:</label>
                <input
                  type="text"
                  name="isbn"
                  value={editForm.isbn}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Назва книги:</label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Опис:</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Автори (Ім'я Прізвище, через кому):</label>
                <input
                  type="text"
                  name="authors"
                  value={editForm.authors}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Видавництво:</label>
                <input
                  type="text"
                  name="publisher"
                  value={editForm.publisher}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Дата видання:</label>
                <input
                  type="date"
                  name="publishDate"
                  value={editForm.publishDate}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Кількість сторінок:</label>
                <input
                  type="number"
                  name="pageCount"
                  value={editForm.pageCount}
                  onChange={handleEditChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Мова:</label>
                <input
                  type="text"
                  name="language"
                  value={editForm.language}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Категорія:</label>
                <input
                  type="text"
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Кількість копій:</label>
                <input
                  type="number"
                  name="totalCopies"
                  value={editForm.totalCopies}
                  onChange={handleEditChange}
                  required
                  min="1"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">Зберегти зміни</button>
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальне вікно підтвердження видалення */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Підтвердження видалення</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Ви впевнені, що хочете видалити книгу?</p>
              <p><strong>{selectedBook?.title}</strong></p>
              <p className="warning-text">Цю дію неможливо скасувати!</p>
            </div>
            <div className="modal-actions">
              <button onClick={handleConfirmDelete} className="btn-danger">
                Так, видалити
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookList;
