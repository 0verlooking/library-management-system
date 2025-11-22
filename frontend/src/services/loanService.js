import api from './api';

const loanService = {
  getAllLoans: () => api.get('/loans'),

  getLoanById: (id) => api.get(`/loans/${id}`),

  getLoansByUser: (userId) => api.get(`/loans/user/${userId}`),

  getLoansByBook: (bookId) => api.get(`/loans/book/${bookId}`),

  getOverdueLoans: () => api.get('/loans/overdue'),

  createLoan: (userId, bookId) => api.post('/loans', null, { params: { userId, bookId } }),

  returnBook: (loanId) => api.put(`/loans/${loanId}/return`),

  renewLoan: (loanId) => api.put(`/loans/${loanId}/renew`),
};

export default loanService;
