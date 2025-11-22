# Sequence Діаграми - Система керування бібліотекою

## 1. Процес видачі книги (Create Loan)

```plantuml
@startuml
actor Бібліотекар
participant "Frontend\n(React)" as Frontend
participant "LoanController" as Controller
participant "LoanService" as Service
participant "BookService" as BookService
participant "UserRepository" as UserRepo
participant "BookRepository" as BookRepo
participant "LoanRepository" as LoanRepo
database "PostgreSQL" as DB

Бібліотекар -> Frontend: Вибрати користувача та книгу
activate Frontend

Frontend -> Controller: POST /api/loans?userId=1&bookId=5
activate Controller

Controller -> Service: createLoan(userId, bookId)
activate Service

Service -> UserRepo: findById(userId)
activate UserRepo
UserRepo -> DB: SELECT * FROM users WHERE id=?
DB --> UserRepo: User data
UserRepo --> Service: User object
deactivate UserRepo

Service -> BookRepo: findById(bookId)
activate BookRepo
BookRepo -> DB: SELECT * FROM books WHERE id=?
DB --> BookRepo: Book data
BookRepo --> Service: Book object
deactivate BookRepo

Service -> Service: Перевірка ліміту позик користувача
Service -> Service: Перевірка доступності книги

Service -> LoanRepo: save(loan)
activate LoanRepo
LoanRepo -> DB: INSERT INTO loans (...)
DB --> LoanRepo: Loan ID
LoanRepo --> Service: Saved Loan
deactivate LoanRepo

Service -> BookService: updateBookAvailability(bookId, -1)
activate BookService
BookService -> BookRepo: findById(bookId)
BookRepo -> DB: SELECT * FROM books
DB --> BookRepo: Book
BookService -> BookService: book.availableCopies--
BookService -> BookRepo: save(book)
BookRepo -> DB: UPDATE books SET available_copies=?
DB --> BookRepo: Success
BookRepo --> BookService: Updated Book
deactivate BookService

Service --> Controller: LoanDTO
deactivate Service

Controller --> Frontend: 201 Created + LoanDTO
deactivate Controller

Frontend --> Бібліотекар: Успішно! Відображення деталей позики
deactivate Frontend

@enduml
```

## 2. Процес повернення книги (Return Book)

```plantuml
@startuml
actor Бібліотекар
participant "Frontend\n(React)" as Frontend
participant "LoanController" as Controller
participant "LoanService" as Service
participant "BookService" as BookService
participant "LoanRepository" as LoanRepo
database "PostgreSQL" as DB

Бібліотекар -> Frontend: Натиснути "Повернути книгу"
activate Frontend

Frontend -> Controller: PUT /api/loans/{id}/return
activate Controller

Controller -> Service: returnBook(loanId)
activate Service

Service -> LoanRepo: findById(loanId)
activate LoanRepo
LoanRepo -> DB: SELECT * FROM loans WHERE id=?
DB --> LoanRepo: Loan data
LoanRepo --> Service: Loan object
deactivate LoanRepo

Service -> Service: Перевірка статусу позики
Service -> Service: loan.setReturnDate(LocalDate.now())
Service -> Service: loan.setStatus(RETURNED)

alt Позика прострочена
    Service -> Service: Розрахунок штрафу
    Service -> Service: daysOverdue = ChronoUnit.DAYS.between(dueDate, now)
    Service -> Service: fine = FINE_PER_DAY * daysOverdue
    Service -> Service: loan.setFineAmount(fine)
end

Service -> LoanRepo: save(loan)
activate LoanRepo
LoanRepo -> DB: UPDATE loans SET return_date=?, status=?, fine_amount=?
DB --> LoanRepo: Success
LoanRepo --> Service: Updated Loan
deactivate LoanRepo

Service -> BookService: updateBookAvailability(bookId, +1)
activate BookService
BookService -> DB: UPDATE books SET available_copies=available_copies+1
DB --> BookService: Success
deactivate BookService

Service --> Controller: LoanDTO
deactivate Service

Controller --> Frontend: 200 OK + LoanDTO
deactivate Controller

Frontend --> Бібліотекар: Книга повернена! Відображення штрафу (якщо є)
deactivate Frontend

@enduml
```

## 3. Процес пошуку книг (Search Books)

```plantuml
@startuml
actor Користувач
participant "Frontend\n(React)" as Frontend
participant "BookController" as Controller
participant "BookService" as Service
participant "BookRepository" as Repo
participant "BookMapper" as Mapper
database "PostgreSQL" as DB

Користувач -> Frontend: Ввести пошуковий запит "Кобзар"
activate Frontend

Frontend -> Frontend: Вибрати тип пошуку (за назвою)

Frontend -> Controller: GET /api/books/search/title?title=Кобзар
activate Controller

Controller -> Service: searchBooksByTitle("Кобзар")
activate Service

Service -> Repo: findByTitleContainingIgnoreCase("Кобзар")
activate Repo

Repo -> DB: SELECT * FROM books b\nWHERE LOWER(b.title) LIKE LOWER('%Кобзар%')
activate DB

DB -> DB: Виконання SQL запиту з JOIN для authors та categories

DB --> Repo: List<Book> entities
deactivate DB

Repo --> Service: List<Book>
deactivate Repo

Service -> Mapper: toDTO(book) для кожної книги
activate Mapper

loop Для кожної книги
    Mapper -> Mapper: Конвертація Entity -> DTO
    Mapper -> Mapper: Мапінг авторів та категорій
end

Mapper --> Service: List<BookDTO>
deactivate Mapper

Service --> Controller: List<BookDTO>
deactivate Service

Controller --> Frontend: 200 OK + List<BookDTO>
deactivate Controller

Frontend -> Frontend: Відображення результатів пошуку

Frontend --> Користувач: Список знайдених книг
deactivate Frontend

@enduml
```

## 4. Процес створення книги (Create Book)

```plantuml
@startuml
actor Бібліотекар
participant "Frontend\n(React)" as Frontend
participant "BookController" as Controller
participant "BookService" as Service
participant "BookMapper" as Mapper
participant "BookRepository" as BookRepo
participant "AuthorRepository" as AuthorRepo
participant "CategoryRepository" as CategoryRepo
database "PostgreSQL" as DB

Бібліотекар -> Frontend: Заповнити форму нової книги
activate Frontend

Frontend -> Frontend: Валідація даних

Frontend -> Controller: POST /api/books
activate Controller
note right: BookDTO з даними книги,\nвключаючи авторів та категорії

Controller -> Service: createBook(bookDTO)
activate Service

Service -> Mapper: toEntity(bookDTO)
activate Mapper

Mapper -> Mapper: Створити Book entity
Mapper -> Mapper: Конвертувати авторів
Mapper -> Mapper: Конвертувати категорії

Mapper --> Service: Book entity
deactivate Mapper

loop Для кожного автора
    Service -> AuthorRepo: findById(authorId) або save(author)
    AuthorRepo -> DB: SELECT/INSERT author
    DB --> AuthorRepo: Author
    AuthorRepo --> Service: Author entity
    Service -> Service: book.authors.add(author)
end

loop Для кожної категорії
    Service -> CategoryRepo: findByName(name) або save(category)
    CategoryRepo -> DB: SELECT/INSERT category
    DB --> CategoryRepo: Category
    CategoryRepo --> Service: Category entity
    Service -> Service: book.categories.add(category)
end

Service -> Service: Встановити availableCopies = totalCopies
Service -> Service: Встановити status = AVAILABLE

Service -> BookRepo: save(book)
activate BookRepo

BookRepo -> DB: BEGIN TRANSACTION
activate DB

DB -> DB: INSERT INTO books (...)
DB -> DB: INSERT INTO book_authors (book_id, author_id)
DB -> DB: INSERT INTO book_categories (book_id, category_id)

DB -> DB: COMMIT

DB --> BookRepo: Saved Book with ID
deactivate DB

BookRepo --> Service: Book entity
deactivate BookRepo

Service -> Mapper: toDTO(book)
activate Mapper
Mapper --> Service: BookDTO
deactivate Mapper

Service --> Controller: BookDTO
deactivate Service

Controller --> Frontend: 201 Created + BookDTO
deactivate Controller

Frontend --> Бібліотекар: Книга успішно створена!
deactivate Frontend

@enduml
```

## 5. Процес продовження позики (Renew Loan)

```plantuml
@startuml
actor Читач
participant "Frontend\n(React)" as Frontend
participant "LoanController" as Controller
participant "LoanService" as Service
participant "LoanRepository" as LoanRepo
database "PostgreSQL" as DB

Читач -> Frontend: Переглянути свої позики
activate Frontend

Frontend -> Frontend: Відобразити список активних позик

Читач -> Frontend: Натиснути "Продовжити позику"

Frontend -> Controller: PUT /api/loans/{id}/renew
activate Controller

Controller -> Service: renewLoan(loanId)
activate Service

Service -> LoanRepo: findById(loanId)
activate LoanRepo
LoanRepo -> DB: SELECT * FROM loans WHERE id=?
DB --> LoanRepo: Loan data
LoanRepo --> Service: Loan object
deactivate LoanRepo

alt Позика неактивна
    Service --> Controller: RuntimeException("Loan is not active")
    Controller --> Frontend: 400 Bad Request
    Frontend --> Читач: Помилка: Позика неактивна
else Позика прострочена
    Service -> Service: loan.isOverdue()
    Service --> Controller: RuntimeException("Cannot renew overdue loan")
    Controller --> Frontend: 400 Bad Request
    Frontend --> Читач: Помилка: Не можна продовжити прострочену позику
else Все ОК
    Service -> Service: dueDate = dueDate.plusDays(14)
    Service -> LoanRepo: save(loan)
    activate LoanRepo
    LoanRepo -> DB: UPDATE loans SET due_date=?
    DB --> LoanRepo: Success
    LoanRepo --> Service: Updated Loan
    deactivate LoanRepo

    Service --> Controller: LoanDTO
    deactivate Service

    Controller --> Frontend: 200 OK + LoanDTO
    deactivate Controller

    Frontend --> Читач: Позику успішно продовжено до {новаДата}
end

deactivate Frontend

@enduml
```

## Опис процесів

### 1. Видача книги
**Учасники:** Бібліотекар, Frontend, Backend Services, Database

**Основні кроки:**
1. Бібліотекар обирає користувача та книгу
2. Система перевіряє ліміт позик користувача
3. Система перевіряє доступність книги
4. Створюється новий запис позики
5. Зменшується кількість доступних примірників книги
6. Повертається інформація про позику

**Виключення:**
- Користувач досяг ліміту позик
- Книга недоступна

### 2. Повернення книги
**Учасники:** Бібліотекар, Frontend, Backend Services, Database

**Основні кроки:**
1. Бібліотекар обирає позику для повернення
2. Система встановлює дату повернення
3. Якщо є прострочення - розраховується штраф
4. Статус позики змінюється на RETURNED
5. Збільшується кількість доступних примірників книги
6. Повертається оновлена інформація про позику

**Бізнес-правила:**
- Штраф = 5 грн * кількість днів прострочення

### 3. Пошук книг
**Учасники:** Користувач, Frontend, Backend Services, Database

**Основні кроки:**
1. Користувач вводить пошуковий запит
2. Система виконує пошук у базі даних
3. Завантажуються пов'язані дані (автори, категорії)
4. Конвертація Entity -> DTO
5. Повернення результатів пошуку

**Типи пошуку:**
- За назвою (LIKE query)
- За автором (JOIN з таблицею authors)
- За категорією (JOIN з таблицею categories)

### 4. Створення книги
**Учасники:** Бібліотекар, Frontend, Backend Services, Database

**Основні кроки:**
1. Бібліотекар заповнює форму
2. Валідація даних
3. Обробка зв'язків Many-to-Many (автори, категорії)
4. Транзакційне збереження в БД
5. Повернення створеної книги

**Транзакційність:**
- Всі операції виконуються в одній транзакції
- У разі помилки - rollback

### 5. Продовження позики
**Учасники:** Читач, Frontend, Backend Services, Database

**Основні кроки:**
1. Читач обирає позику для продовження
2. Перевірка можливості продовження
3. Додавання 14 днів до терміну повернення
4. Збереження оновленої позики

**Обмеження:**
- Не можна продовжити неактивну позику
- Не можна продовжити прострочену позику
