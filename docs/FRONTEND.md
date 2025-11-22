# Frontend Архітектура - Система керування бібліотекою

## Зміст

1. [Технологічний стек](#1-технологічний-стек)
2. [Архітектура Frontend](#2-архітектура-frontend)
3. [Структура проекту](#3-структура-проекту)
4. [Компоненти](#4-компоненти)
5. [Управління станом](#5-управління-станом)
6. [Сервіси та API](#6-сервіси-та-api)
7. [Маршрутизація](#7-маршрутизація)
8. [Автентифікація та авторизація](#8-автентифікація-та-авторизація)
9. [Role-based UI](#9-role-based-ui)
10. [Стилізація](#10-стилізація)

---

## 1. Технологічний стек

### Core Technologies

- **React** 18.2.0 - JavaScript бібліотека для побудови користувацьких інтерфейсів
- **React Router** 6.x - Маршрутизація для Single Page Application
- **Axios** - HTTP клієнт для взаємодії з Backend API
- **CSS3** - Стилізація компонентів

### Development Tools

- **Node.js** 16+ - Runtime середовище
- **npm** - Менеджер пакетів
- **Nginx** - Веб-сервер для production deployment

### Build & Deployment

- **Create React App** - Базова конфігурація проекту
- **Docker** - Контейнеризація
- **Nginx** - Reverse proxy та статичний файл-сервер

---

## 2. Архітектура Frontend

### Component-Based Architecture

```
┌─────────────────────────────────────────────────┐
│                  App.js                          │
│         (Main Application Component)             │
│                                                   │
│   ┌──────────────────────────────────────────┐  │
│   │         React Router                      │  │
│   │                                           │  │
│   │  /login      →  Login Component          │  │
│   │  /books      →  BookList Component       │  │
│   │  /loans      →  LoanList Component       │  │
│   │  /dashboard  →  Role-specific Dashboard  │  │
│   └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    │
                    │
      ┌─────────────┴──────────────┐
      │                            │
      ▼                            ▼
┌──────────────┐          ┌──────────────────┐
│  Components  │          │     Services     │
│              │          │                  │
│ - BookList   │          │ - bookService    │
│ - LoanList   │ ────────►│ - loanService    │
│ - Dashboard  │          │ - authService    │
│ - Login      │          │ - userService    │
└──────────────┘          └────────┬─────────┘
                                   │
                                   │ Axios
                                   ▼
                          ┌──────────────────┐
                          │   Backend API    │
                          │  (REST Endpoints)│
                          └──────────────────┘
```

### Layered Architecture

```
┌─────────────────────────────────────────────┐
│          Presentation Layer                  │
│         (React Components)                   │
│                                              │
│  - BookList.js                               │
│  - LoanList.js                               │
│  - AdminDashboard.js                         │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────┴───────────────────────────┐
│           Service Layer                       │
│         (API Communication)                   │
│                                              │
│  - bookService.js                            │
│  - loanService.js                            │
│  - authService.js                            │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────┴───────────────────────────┐
│          Utility Layer                        │
│      (API Client, Auth Utils)                │
│                                              │
│  - api.js (Axios instance)                   │
└──────────────────────────────────────────────┘
```

---

## 3. Структура проекту

```
frontend/
├── public/
│   ├── index.html                 # HTML template
│   └── favicon.ico
│
├── src/
│   ├── components/                # React компоненти
│   │   ├── AdminDashboard.js      # Dashboard для адміністратора
│   │   ├── LibrarianDashboard.js  # Dashboard для бібліотекаря
│   │   ├── ReaderDashboard.js     # Dashboard для читача
│   │   ├── BookList.js            # Список книг
│   │   ├── LoanList.js            # Список позик
│   │   ├── Login.js               # Сторінка логіну
│   │   ├── ProtectedRoute.js      # HOC для захищених маршрутів
│   │   ├── BookList.css           # Стилі для BookList
│   │   ├── LoanList.css           # Стилі для LoanList
│   │   └── Dashboard.css          # Стилі для Dashboards
│   │
│   ├── services/                  # API сервіси
│   │   ├── api.js                 # Axios instance + interceptors
│   │   ├── authService.js         # Авторизація
│   │   ├── bookService.js         # Операції з книгами
│   │   ├── loanService.js         # Операції з позиками
│   │   └── userService.js         # Операції з користувачами
│   │
│   ├── App.js                     # Головний компонент
│   ├── App.css                    # Глобальні стилі
│   ├── index.js                   # Entry point
│   └── index.css                  # Base стилі
│
├── nginx.conf                     # Nginx конфігурація
├── Dockerfile                     # Docker образ для production
├── package.json                   # Залежності та scripts
└── package-lock.json
```

---

## 4. Компоненти

### 4.1 App Component (Main)

**frontend/src/App.js**
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import BookList from './components/BookList';
import LoanList from './components/LoanList';
import AdminDashboard from './components/AdminDashboard';
import LibrarianDashboard from './components/LibrarianDashboard';
import ReaderDashboard from './components/ReaderDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/books" element={
            <ProtectedRoute>
              <BookList />
            </ProtectedRoute>
          } />

          <Route path="/loans" element={
            <ProtectedRoute>
              <LoanList />
            </ProtectedRoute>
          } />

          {/* Role-specific dashboards */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/librarian-dashboard" element={
            <ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}>
              <LibrarianDashboard />
            </ProtectedRoute>
          } />

          <Route path="/reader-dashboard" element={
            <ProtectedRoute roles={['READER']}>
              <ReaderDashboard />
            </ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

### 4.2 Admin Dashboard Component

**frontend/src/components/AdminDashboard.js** (основні можливості)

```javascript
function AdminDashboard() {
  // State management
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    activeLoans: 0,
    overdueLoans: 0
  });

  const [showBookModal, setShowBookModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [bookForm, setBookForm] = useState({ /* ... */ });
  const [userForm, setUserForm] = useState({ /* ... */ });

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Паралельне завантаження всіх даних
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
  };

  // Handlers
  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await bookService.createBook(bookData);
      setSuccess('Книгу успішно додано!');
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Statistics cards */}
      <div className="stats-grid">
        <StatCard icon="📚" value={stats.totalBooks} label="Всього книг" />
        <StatCard icon="✅" value={stats.availableBooks} label="Доступно" />
        <StatCard icon="📖" value={stats.activeLoans} label="Активні позики" />
        <StatCard icon="⚠️" value={stats.overdueLoans} label="Прострочені" />
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <button onClick={() => setShowBookModal(true)}>➕ Додати книгу</button>
        <button onClick={() => setShowUserModal(true)}>👥 Додати користувача</button>
      </div>

      {/* Modal windows */}
      {showBookModal && <BookModal onSubmit={handleAddBook} />}
      {showUserModal && <UserModal onSubmit={handleAddUser} />}
    </div>
  );
}
```

**Особливості:**
- **State Management:** useState для локального стану
- **Side Effects:** useEffect для завантаження даних
- **Modal Windows:** Динамічне відображення форм
- **Error Handling:** Відображення помилок користувачу
- **Optimistic Updates:** Оновлення UI після успішних операцій

### 4.3 Book List Component

**frontend/src/components/BookList.js**

```javascript
function BookList() {
  const [books, setBooks] = useState([]);
  const [searchType, setSearchType] = useState('title');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load books on component mount
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const response = await bookService.getAllBooks();
      setBooks(response.data);
    } catch (err) {
      setError('Помилка завантаження книг');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let response;
      switch(searchType) {
        case 'title':
          response = await bookService.searchByTitle(searchTerm);
          break;
        case 'author':
          response = await bookService.searchByAuthor(searchTerm);
          break;
        case 'category':
          response = await bookService.searchByCategory(searchTerm);
          break;
        default:
          response = await bookService.getAllBooks();
      }
      setBooks(response.data);
    } catch (err) {
      setError('Помилка пошуку');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Завантаження...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="book-list-container">
      {/* Search bar */}
      <div className="search-bar">
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
          <option value="title">Назва</option>
          <option value="author">Автор</option>
          <option value="category">Категорія</option>
        </select>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Пошук..."
        />
        <button onClick={handleSearch}>Шукати</button>
        <button onClick={loadBooks}>Скинути</button>
      </div>

      {/* Books grid */}
      <div className="books-grid">
        {books.map(book => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
```

### 4.4 Protected Route Component

**frontend/src/components/ProtectedRoute.js**

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

function ProtectedRoute({ children, roles }) {
  const user = authService.getCurrentUser();

  // Перевірка авторизації
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Перевірка ролі (якщо вказано)
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

---

## 5. Управління станом

### Local State (useState)

```javascript
// Локальний стан компонента
const [books, setBooks] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

// Оновлення стану
setBooks(newBooks);
setLoading(true);
```

### Side Effects (useEffect)

```javascript
// Завантаження даних при монтуванні компонента
useEffect(() => {
  const fetchData = async () => {
    const response = await bookService.getAllBooks();
    setBooks(response.data);
  };
  fetchData();
}, []); // Порожній масив = виконати один раз

// Реагування на зміни
useEffect(() => {
  if (searchTerm) {
    handleSearch();
  }
}, [searchTerm]); // Виконати при зміні searchTerm
```

### Global State (LocalStorage)

```javascript
// Збереження в localStorage
localStorage.setItem('user', JSON.stringify(user));

// Читання з localStorage
const user = JSON.parse(localStorage.getItem('user'));

// Видалення з localStorage
localStorage.removeItem('user');
```

---

## 6. Сервіси та API

### 6.1 API Client (Axios Instance)

**frontend/src/services/api.js**

```javascript
import axios from 'axios';

// Створення axios instance з базовою конфігурацією
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - додавання JWT токену
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - обробка помилок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 6.2 Book Service

**frontend/src/services/bookService.js**

```javascript
import api from './api';

const bookService = {
  // Отримати всі книги
  getAllBooks() {
    return api.get('/books');
  },

  // Отримати книгу за ID
  getBookById(id) {
    return api.get(`/books/${id}`);
  },

  // Пошук за назвою
  searchByTitle(title) {
    return api.get(`/books/search/title?title=${title}`);
  },

  // Пошук за автором
  searchByAuthor(author) {
    return api.get(`/books/search/author?author=${author}`);
  },

  // Пошук за категорією
  searchByCategory(category) {
    return api.get(`/books/search/category?category=${category}`);
  },

  // Отримати доступні книги
  getAvailableBooks() {
    return api.get('/books/available');
  },

  // Створити книгу
  createBook(bookData) {
    return api.post('/books', bookData);
  },

  // Оновити книгу
  updateBook(id, bookData) {
    return api.put(`/books/${id}`, bookData);
  },

  // Видалити книгу
  deleteBook(id) {
    return api.delete(`/books/${id}`);
  },
};

export default bookService;
```

### 6.3 Auth Service

**frontend/src/services/authService.js**

```javascript
import api from './api';

const authService = {
  // Вхід
  login(username, password) {
    return api.post('/auth/login', { username, password })
      .then(response => {
        if (response.data.token) {
          localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
      });
  },

  // Вихід
  logout() {
    localStorage.removeItem('user');
  },

  // Отримати поточного користувача
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  },

  // Реєстрація
  register(userData) {
    return api.post('/auth/register', userData);
  },
};

export default authService;
```

---

## 7. Маршрутизація

### React Router Configuration

```javascript
<Router>
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<Login />} />

    {/* Protected routes - доступні тільки авторизованим */}
    <Route path="/books" element={
      <ProtectedRoute>
        <BookList />
      </ProtectedRoute>
    } />

    {/* Role-based routes - доступні тільки певним ролям */}
    <Route path="/admin-dashboard" element={
      <ProtectedRoute roles={['ADMIN']}>
        <AdminDashboard />
      </ProtectedRoute>
    } />

    {/* Redirect */}
    <Route path="/" element={<Navigate to="/login" />} />
  </Routes>
</Router>
```

### Programmatic Navigation

```javascript
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    await authService.login(username, password);
    // Перенаправлення на dashboard після логіну
    navigate('/admin-dashboard');
  };
}
```

---

## 8. Автентифікація та авторизація

### Authentication Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Login (username, password)
     ▼
┌────────────────┐
│  Login.js      │
└────┬───────────┘
     │
     │ 2. POST /api/auth/login
     ▼
┌────────────────┐
│  Backend API   │
└────┬───────────┘
     │
     │ 3. JWT Token + User Data
     ▼
┌────────────────┐
│ authService.js │──► 4. Save to localStorage
└────┬───────────┘
     │
     │ 5. Redirect to Dashboard
     ▼
┌────────────────┐
│  Dashboard     │
└────────────────┘
```

### JWT Token Management

```javascript
// Збереження токену при логіні
const response = await api.post('/auth/login', { username, password });
localStorage.setItem('user', JSON.stringify(response.data));
// response.data = { token: "jwt...", username: "admin", role: "ADMIN" }

// Додавання токену до кожного запиту (api.js interceptor)
config.headers.Authorization = `Bearer ${user.token}`;

// Видалення при logout
localStorage.removeItem('user');
```

---

## 9. Role-based UI

### Dashboard Routing based on Role

```javascript
function Login() {
  const handleLogin = async (e) => {
    const response = await authService.login(username, password);
    const user = response;

    // Перенаправлення на відповідний dashboard
    switch(user.role) {
      case 'ADMIN':
        navigate('/admin-dashboard');
        break;
      case 'LIBRARIAN':
        navigate('/librarian-dashboard');
        break;
      case 'READER':
        navigate('/reader-dashboard');
        break;
      default:
        navigate('/');
    }
  };
}
```

### Role-specific Features

```javascript
// AdminDashboard - повний доступ
function AdminDashboard() {
  return (
    <>
      <button onClick={addBook}>➕ Додати книгу</button>
      <button onClick={addUser}>👥 Додати користувача</button>
      <button onClick={viewAllLoans}>📋 Всі позики</button>
    </>
  );
}

// LibrarianDashboard - обмежений доступ
function LibrarianDashboard() {
  return (
    <>
      <button onClick={addBook}>➕ Додати книгу</button>
      {/* Немає кнопки додавання користувача */}
      <button onClick={issueBook}>📖 Видати книгу</button>
    </>
  );
}

// ReaderDashboard - тільки перегляд
function ReaderDashboard() {
  return (
    <>
      <BookList />
      <MyLoans />
      {/* Немає адміністративних функцій */}
    </>
  );
}
```

---

## 10. Стилізація

### CSS Modules Approach

Кожен компонент має власний CSS файл:

```
BookList.js       → BookList.css
LoanList.js       → LoanList.css
AdminDashboard.js → Dashboard.css
```

### Responsive Design

```css
/* Desktop */
.books-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* Tablet */
@media (max-width: 1024px) {
  .books-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .books-grid {
    grid-template-columns: 1fr;
  }
}
```

### Component Styling Example

```css
/* Dashboard.css */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
```

---

## Висновок

Frontend архітектура проекту базується на наступних принципах:

### Ключові особливості:

1. **Component-Based Architecture:** Модульні React компоненти
2. **Service Layer:** Відокремлення бізнес-логіки від UI
3. **Protected Routes:** Захист маршрутів на основі ролей
4. **Axios Interceptors:** Централізована обробка HTTP запитів
5. **Role-Based UI:** Різні інтерфейси для різних ролей
6. **Responsive Design:** Адаптивний дизайн для всіх пристроїв
7. **Error Handling:** Обробка помилок на рівні UI

### Переваги архітектури:

- **Модульність:** Легко додавати нові компоненти
- **Повторне використання:** Компоненти та сервіси можна повторно використовувати
- **Тестованість:** Кожен компонент можна тестувати окремо
- **Масштабованість:** Легко розширювати функціональність
- **Безпека:** Захист маршрутів та автентифікація
- **UX:** Зручний та інтуїтивний інтерфейс

### Структура даних:

| Шар | Призначення | Технології |
|-----|------------|-----------|
| **Presentation** | UI Components | React, CSS |
| **Service** | API Communication | Axios |
| **Utility** | Auth, Config | localStorage, Interceptors |
