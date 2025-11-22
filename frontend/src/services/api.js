import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Додати interceptor для автоматичного додавання JWT токену до кожного запиту
api.interceptors.request.use(
  (config) => {
    // Не додавати токен до auth endpoints
    if (config.url && config.url.startsWith('/auth')) {
      return config;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Додати interceptor для обробки помилок автентифікації
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Якщо отримали 401 (Unauthorized), видалити токен
      localStorage.removeItem('user');
      // Перенаправити на логін тільки якщо не на сторінці логіну
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
