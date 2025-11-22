import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

/**
 * Сервіс для роботи з автентифікацією
 */
class AuthService {
  /**
   * Вхід користувача
   */
  async login(username, password) {
    const response = await axios.post(`${API_URL}/login`, {
      username,
      password
    });

    if (response.data.token) {
      // Зберегти токен та інформацію про користувача в localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  }

  /**
   * Реєстрація нового користувача
   */
  async register(username, email, password, firstName, lastName) {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password,
      firstName,
      lastName
    });

    return response.data;
  }

  /**
   * Вихід користувача
   */
  logout() {
    localStorage.removeItem('user');
  }

  /**
   * Отримати поточного користувача
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  /**
   * Перевірити чи користувач автентифікований
   */
  isAuthenticated() {
    const user = this.getCurrentUser();
    return user !== null && user.token !== undefined;
  }

  /**
   * Отримати токен
   */
  getToken() {
    const user = this.getCurrentUser();
    return user?.token;
  }

  /**
   * Перевірити чи користувач має певну роль
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Перевірити чи користувач адміністратор
   */
  isAdmin() {
    return this.hasRole('ADMIN');
  }

  /**
   * Перевірити чи користувач бібліотекар
   */
  isLibrarian() {
    return this.hasRole('LIBRARIAN');
  }

  /**
   * Перевірити чи користувач читач
   */
  isReader() {
    return this.hasRole('READER');
  }
}

export default new AuthService();
