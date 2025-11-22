# Система керування бібліотекою

## 1. Технічне завдання

### 1.1 Загальний опис
Веб-система для керування бібліотекою - це комплексне рішення для автоматизації процесів роботи бібліотеки, включаючи облік книг, користувачів, позик та бронювань.

### 1.2 Мета проекту
Розробка веб-застосунку для ефективного управління книжковим фондом, обліку користувачів та автоматизації процесів видачі і повернення книг.

### 1.3 Цільова аудиторія
- Бібліотекарі (адміністратори системи)
- Читачі (користувачі бібліотеки)
- Адміністратори бібліотеки

### 1.4 Функціональні вимоги

#### Управління книгами:
- Додавання, редагування та видалення книг
- Пошук книг за назвою, автором, категорією
- Перегляд інформації про книгу (назва, автори, ISBN, видавництво, кількість примірників)
- Відстеження доступності книг

#### Управління користувачами:
- Реєстрація та автентифікація користувачів
- Різні ролі користувачів (адміністратор, бібліотекар, читач)
- Управління обліковими записами

#### Управління позиками:
- Видача книг користувачам
- Повернення книг
- Продовження терміну позики
- Автоматичний розрахунок штрафів за прострочення
- Відстеження прострочених позик

#### Управління бронюваннями:
- Бронювання недоступних книг
- Автоматичне скасування прострочених бронювань

### 1.5 Нефункціональні вимоги
- Відмовостійкість та надійність
- Масштабованість
- Безпека даних
- Зручний інтерфейс користувача
- Кросбраузерна сумісність

## 2. Технологічний стек

### Backend:
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- Spring Security
- PostgreSQL
- Maven

### Frontend:
- React 18
- React Router
- Axios
- CSS3

### DevOps:
- Docker
- Docker Compose
- Nginx

## 3. Архітектура системи

### 3.1 Архітектурний патерн
Система побудована на основі **трирівневої архітектури**:
- **Presentation Layer** (React Frontend)
- **Business Logic Layer** (Spring Boot Backend)
- **Data Access Layer** (Spring Data JPA + PostgreSQL)

### 3.2 Принципи SOLID

#### Single Responsibility Principle (SRP)
Кожен клас має одну відповідальність:
- `BookService` - відповідає тільки за бізнес-логіку книг
- `LoanService` - відповідає тільки за бізнес-логіку позик
- `BookRepository` - відповідає тільки за доступ до даних книг

#### Open/Closed Principle (OCP)
Класи відкриті для розширення, але закриті для модифікації:
- Використання інтерфейсів для сервісів дозволяє створювати нові реалізації без зміни існуючого коду

#### Liskov Substitution Principle (LSP)
Реалізації можуть бути замінені своїми інтерфейсами:
- `BookServiceImpl` може бути замінена будь-якою іншою реалізацією `BookService`

#### Interface Segregation Principle (ISP)
Інтерфейси розділені за функціональністю:
- `BookService`, `LoanService`, `UserService` - окремі інтерфейси для кожної сутності

#### Dependency Inversion Principle (DIP)
Залежність від абстракцій, а не від конкретних реалізацій:
- Сервіси залежать від інтерфейсів `Repository`, а не від конкретних реалізацій

### 3.3 Патерни проектування

#### 1. Repository Pattern
**Використання:** Spring Data JPA Repositories
- `BookRepository`, `LoanRepository`, `UserRepository`
- Абстракція для доступу до даних

#### 2. Service Layer Pattern
**Використання:** Service classes
- Розділення бізнес-логіки від контролерів
- `BookServiceImpl`, `LoanServiceImpl`

#### 3. Data Transfer Object (DTO) Pattern
**Використання:** DTO classes
- `BookDTO`, `LoanDTO`, `UserDTO`
- Передача даних між шарами без експозиції entities

#### 4. Adapter Pattern
**Використання:** Mapper classes
- `BookMapper`, `LoanMapper`, `UserMapper`
- Конвертація між Entity та DTO

#### 5. Strategy Pattern
**Використання:** Fine calculation
- Розрахунок штрафів за прострочення в `LoanService`
- Можливість легкої зміни стратегії розрахунку

#### 6. Dependency Injection Pattern
**Використання:** Spring Framework
- Constructor injection для всіх залежностей
- Управління життєвим циклом об'єктів через Spring Container

## 4. Структура бази даних

### 4.1 Таблиці

#### users
- id (PRIMARY KEY)
- username (UNIQUE)
- email (UNIQUE)
- password
- first_name
- last_name
- phone
- role (ENUM: ADMIN, LIBRARIAN, READER)
- status (ENUM: ACTIVE, SUSPENDED, INACTIVE)
- max_loans
- created_at
- updated_at

#### books
- id (PRIMARY KEY)
- isbn (UNIQUE)
- title
- description
- publish_date
- publisher
- page_count
- language
- total_copies
- available_copies
- status (ENUM: AVAILABLE, CHECKED_OUT, RESERVED, MAINTENANCE, LOST)
- created_at
- updated_at

#### authors
- id (PRIMARY KEY)
- first_name
- last_name
- biography
- birth_date
- nationality

#### categories
- id (PRIMARY KEY)
- name (UNIQUE)
- description

#### loans
- id (PRIMARY KEY)
- user_id (FOREIGN KEY -> users)
- book_id (FOREIGN KEY -> books)
- loan_date
- due_date
- return_date
- status (ENUM: ACTIVE, RETURNED, OVERDUE, LOST)
- fine_amount
- notes
- created_at

#### reservations
- id (PRIMARY KEY)
- user_id (FOREIGN KEY -> users)
- book_id (FOREIGN KEY -> books)
- reservation_date
- expiry_date
- status (ENUM: PENDING, FULFILLED, CANCELLED, EXPIRED)
- created_at

#### book_authors (Many-to-Many)
- book_id (FOREIGN KEY -> books)
- author_id (FOREIGN KEY -> authors)

#### book_categories (Many-to-Many)
- book_id (FOREIGN KEY -> books)
- category_id (FOREIGN KEY -> categories)

### 4.2 Діаграма ER (Entity-Relationship)
```
users 1----* loans *----1 books
users 1----* reservations *----1 books
books *----* authors (через book_authors)
books *----* categories (через book_categories)
```

## 5. API Endpoints

### Books
- `GET /api/books` - Отримати всі книги
- `GET /api/books/{id}` - Отримати книгу за ID
- `GET /api/books/isbn/{isbn}` - Отримати книгу за ISBN
- `GET /api/books/search/title?title={title}` - Пошук за назвою
- `GET /api/books/search/author?author={name}` - Пошук за автором
- `GET /api/books/search/category?category={name}` - Пошук за категорією
- `GET /api/books/available` - Отримати доступні книги
- `POST /api/books` - Створити нову книгу
- `PUT /api/books/{id}` - Оновити книгу
- `DELETE /api/books/{id}` - Видалити книгу

### Loans
- `GET /api/loans` - Отримати всі позики
- `GET /api/loans/{id}` - Отримати позику за ID
- `GET /api/loans/user/{userId}` - Отримати позики користувача
- `GET /api/loans/book/{bookId}` - Отримати позики книги
- `GET /api/loans/overdue` - Отримати прострочені позики
- `POST /api/loans?userId={id}&bookId={id}` - Створити нову позику
- `PUT /api/loans/{id}/return` - Повернути книгу
- `PUT /api/loans/{id}/renew` - Продовжити позику

## 6. Розгортання з Docker

### 6.1 Вимоги
- Docker Engine 20.10+
- Docker Compose 2.0+

### 6.2 Запуск системи

```bash
# Клонувати репозиторій
git clone <repository-url>
cd library-management-system

# Запустити всі сервіси
docker-compose up -d

# Перевірити статус сервісів
docker-compose ps

# Переглянути логи
docker-compose logs -f
```

### 6.3 Доступ до системи
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- PostgreSQL: localhost:5432

### 6.4 Зупинка системи
```bash
docker-compose down

# Видалення даних
docker-compose down -v
```

## 7. Розробка без Docker

### Backend
```bash
cd backend

# Запустити PostgreSQL локально
# Налаштувати application.yml з локальними credentials

mvn spring-boot:run
```

### Frontend
```bash
cd frontend

npm install
npm start
```

## 8. Структура проекту

```
library-management-system/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/library/
│   │   │   │   ├── controller/      # REST контролери
│   │   │   │   ├── service/         # Бізнес-логіка
│   │   │   │   ├── repository/      # Data Access Layer
│   │   │   │   ├── model/           # Entity класи (ORM)
│   │   │   │   ├── dto/             # Data Transfer Objects
│   │   │   │   └── mapper/          # Entity-DTO конвертери
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/             # React компоненти
│   │   ├── services/               # API сервіси
│   │   ├── App.js
│   │   └── index.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docs/
│   └── diagrams/                   # UML діаграми
├── docker-compose.yml
└── README.md
```

## 9. Безпека

- Використання Spring Security для автентифікації та авторизації
- JWT токени для stateless сесій
- CORS конфігурація для безпечної взаємодії Frontend-Backend
- Валідація даних на рівні Backend
- Хешування паролів (BCrypt)

## 10. Можливості для розширення

- Інтеграція з електронними бібліотеками
- Система рекомендацій книг
- Мобільний додаток
- Інтеграція з платіжними системами для оплати штрафів
- Система сповіщень (email, SMS)
- Статистика та аналітика

## Автор
Курсова робота з розробки програмного забезпечення

## Ліцензія
MIT
