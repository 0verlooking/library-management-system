import React, { useState, useEffect } from 'react';
import bookService from '../services/bookService';
import './BookList.css';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="book-list-container">
      <h1>Каталог книг</h1>

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
          Пошук
        </button>

        <button onClick={fetchBooks} className="reset-button">
          Скинути
        </button>
      </div>

      {loading && <div className="loading">Завантаження...</div>}
      {error && <div className="error">{error}</div>}

      <div className="books-grid">
        {books.map((book) => (
          <div key={book.id} className="book-card">
            <h3>{book.title}</h3>
            <p><strong>ISBN:</strong> {book.isbn}</p>
            {book.authors && book.authors.length > 0 && (
              <p><strong>Автори:</strong> {book.authors.map(a => `${a.firstName} ${a.lastName}`).join(', ')}</p>
            )}
            {book.publisher && <p><strong>Видавництво:</strong> {book.publisher}</p>}
            {book.publishDate && <p><strong>Рік видання:</strong> {new Date(book.publishDate).getFullYear()}</p>}
            <p><strong>Доступно:</strong> {book.availableCopies} з {book.totalCopies}</p>
            <p className={`status ${book.status.toLowerCase()}`}>
              <strong>Статус:</strong> {book.status === 'AVAILABLE' ? 'Доступна' : 'Недоступна'}
            </p>
          </div>
        ))}
      </div>

      {books.length === 0 && !loading && (
        <div className="no-results">Книги не знайдено</div>
      )}
    </div>
  );
};

export default BookList;
