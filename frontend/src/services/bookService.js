import api from './api';

const bookService = {
  getAllBooks: () => api.get('/books'),

  getBookById: (id) => api.get(`/books/${id}`),

  searchByTitle: (title) => api.get('/books/search/title', { params: { title } }),

  searchByAuthor: (author) => api.get('/books/search/author', { params: { author } }),

  searchByCategory: (category) => api.get('/books/search/category', { params: { category } }),

  getAvailableBooks: () => api.get('/books/available'),

  createBook: (book) => api.post('/books', book),

  updateBook: (id, book) => api.put(`/books/${id}`, book),

  deleteBook: (id) => api.delete(`/books/${id}`),
};

export default bookService;
