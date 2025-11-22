import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      // Перенаправити на головну сторінку після успішного входу
      navigate('/');
      window.location.reload(); // Перезавантажити для оновлення стану автентифікації
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка входу. Перевірте username та password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Вхід до системи</h2>
        <p className="login-subtitle">Система керування бібліотекою</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Введіть username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Введіть password"
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>

        <div className="login-footer">
          <p>Тестові користувачі:</p>
          <ul>
            <li><strong>admin</strong> / admin123 (Адміністратор)</li>
            <li><strong>librarian</strong> / lib123 (Бібліотекар)</li>
            <li><strong>reader1</strong> / read123 (Читач)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;
