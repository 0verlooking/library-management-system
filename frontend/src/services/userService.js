import api from './api';

const userService = {
  // Отримати всіх користувачів (потрібно додати endpoint на backend)
  getAllUsers: () => api.get('/users'),

  // Отримати користувача за ID
  getUserById: (id) => api.get(`/users/${id}`),

  // Створити нового користувача (використовує /auth/register)
  createUser: (userData) => api.post('/auth/register', userData),

  // Оновити користувача
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),

  // Видалити користувача
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export default userService;
