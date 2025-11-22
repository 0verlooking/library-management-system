# Інструкція з розгортання та тестування

## 🚀 Швидкий старт

### 1. Запуск системи з Docker

```bash
# Перейти в директорію проекту
cd library-management-system

# Зупинити попередні контейнери (якщо були)
docker compose down

# Збудувати та запустити всі сервіси
docker compose up --build -d

# Переглянути статус контейнерів
docker compose ps
```

### 2. Перевірка логів

```bash
# Всі логи
docker compose logs -f

# Тільки backend
docker compose logs -f backend

# Тільки frontend
docker compose logs -f frontend

# Тільки PostgreSQL
docker compose logs -f postgres
```

### 3. Очікувані результати

**Всі контейнери повинні бути "healthy":**
```
NAME               STATUS
library-backend    Up (healthy)
library-frontend   Up
library-postgres   Up (healthy)
```

**Backend логи повинні містити:**
```
Started LibraryManagementApplication in X.XXX seconds
```

## 🧪 Тестування

### Тест 1: Health Check

```bash
curl http://localhost:8080/api/actuator/health
```

**Очікуваний результат:**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    }
  }
}
```

### Тест 2: API Endpoints

**Отримати всі книги:**
```bash
curl http://localhost:8080/api/books
```

**Очікуваний результат:** JSON масив (може бути порожнім `[]`)

**Отримати всі позики:**
```bash
curl http://localhost:8080/api/loans
```

**Очікуваний результат:** JSON масив (може бути порожнім `[]`)

### Тест 3: Додати тестову книгу

```bash
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "978-966-03-4567-8",
    "title": "Кобзар",
    "description": "Збірка поезій Тараса Шевченка",
    "publisher": "А-БА-БА-ГА-ЛАМАГА",
    "publishDate": "2019-03-09",
    "language": "Українська",
    "totalCopies": 3,
    "availableCopies": 3,
    "status": "AVAILABLE",
    "authors": [],
    "categories": []
  }'
```

**Очікуваний результат:** JSON об'єкт з даними створеної книги

### Тест 4: Frontend

1. Відкрити браузер: http://localhost:3000
2. Перевірити консоль браузера (F12) - **не повинно бути CORS помилок**
3. Перейти на "Каталог книг" - повинен відображатися список книг
4. Перейти на "Позики" - повинен відображатися список позик

## 🔧 Troubleshooting

### Backend "unhealthy"

**Проблема:** Backend показує статус "unhealthy"

**Рішення:**
```bash
# Перевірити логи
docker compose logs backend

# Перевірити, чи працює БД
docker compose exec postgres psql -U library_user -d library_db -c "\dt"

# Перезапустити backend
docker compose restart backend

# Якщо не допомагає - повний rebuild
docker compose down
docker compose up --build -d
```

### CORS помилки

**Проблема:** `blocked by CORS policy` в консолі браузера

**Перевірка:**
1. Переконайтесь, що backend запущений та здоровий
2. Перевірте, що SecurityConfig та WebConfig присутні
3. Очистіть кеш браузера (Ctrl+Shift+Del)

### База даних не підключається

**Проблема:** Backend логи показують помилки підключення до БД

**Рішення:**
```bash
# Перевірити статус PostgreSQL
docker compose ps postgres

# Перевірити логи PostgreSQL
docker compose logs postgres

# Перевірити підключення вручну
docker compose exec postgres psql -U library_user -d library_db

# Якщо не допомагає - видалити volume і створити заново
docker compose down -v
docker compose up -d
```

### Frontend не завантажується

**Проблема:** Frontend показує порожню сторінку

**Рішення:**
```bash
# Перевірити логи Nginx
docker compose logs frontend

# Перевірити, чи файли були скопійовані
docker compose exec frontend ls -la /usr/share/nginx/html

# Rebuild frontend
docker compose up --build -d frontend
```

## 📊 Моніторинг

### Перевірка використання ресурсів

```bash
docker compose stats
```

### Підключення до контейнерів

```bash
# Backend
docker compose exec backend sh

# PostgreSQL
docker compose exec postgres psql -U library_user -d library_db

# Frontend
docker compose exec frontend sh
```

### Перевірка мережі

```bash
# Список мереж
docker network ls

# Інспекція мережі
docker network inspect library-management-system_library-network
```

## 🛑 Зупинка системи

```bash
# Зупинити всі сервіси
docker compose down

# Зупинити та видалити volumes (БД)
docker compose down -v

# Зупинити та видалити images
docker compose down --rmi all

# Повне очищення
docker compose down -v --rmi all --remove-orphans
```

## 📝 Корисні команди

```bash
# Перезапустити всі сервіси
docker compose restart

# Перезапустити тільки backend
docker compose restart backend

# Переглянути конфігурацію
docker compose config

# Перебудувати без кешу
docker compose build --no-cache

# Запустити в foreground (з логами в консолі)
docker compose up
```

## 🎯 Очікувані порти

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/api
- **Health Check:** http://localhost:8080/api/actuator/health
- **PostgreSQL:** localhost:5432

## ✅ Чеклист успішного розгортання

- [ ] Всі контейнери запущені (`docker compose ps`)
- [ ] Backend має статус "healthy"
- [ ] PostgreSQL має статус "healthy"
- [ ] Health check повертає `{"status":"UP"}`
- [ ] API `/books` доступний
- [ ] API `/loans` доступний
- [ ] Frontend відкривається в браузері
- [ ] Немає CORS помилок в консолі браузера
- [ ] Можна додати тестову книгу через API
