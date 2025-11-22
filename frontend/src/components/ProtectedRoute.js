import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * Компонент для захисту маршрутів, що вимагають автентифікації
 */
function ProtectedRoute({ children, requiredRole }) {
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  // Якщо користувач не автентифікований, перенаправити на логін
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Якщо вказана роль і користувач не має цієї ролі, показати помилку
  if (requiredRole && currentUser.role !== requiredRole) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>🚫 Доступ заборонено</h2>
        <p>У вас немає прав для перегляду цієї сторінки.</p>
        <p>Необхідна роль: <strong>{requiredRole}</strong></p>
        <p>Ваша роль: <strong>{currentUser.role}</strong></p>
      </div>
    );
  }

  // Якщо все ОК, показати компонент
  return children;
}

export default ProtectedRoute;
