# SOLID Принципи в проекті - Система керування бібліотекою

## Зміст
1. [Single Responsibility Principle (SRP)](#1-single-responsibility-principle-srp)
2. [Open/Closed Principle (OCP)](#2-openclosed-principle-ocp)
3. [Liskov Substitution Principle (LSP)](#3-liskov-substitution-principle-lsp)
4. [Interface Segregation Principle (ISP)](#4-interface-segregation-principle-isp)
5. [Dependency Inversion Principle (DIP)](#5-dependency-inversion-principle-dip)

---

## 1. Single Responsibility Principle (SRP)

> Кожен клас повинен мати одну і тільки одну причину для зміни

### Реалізація в проекті

#### 1.1 Service Layer

**BookServiceImpl.java** (backend/src/main/java/com/library/service/impl/BookServiceImpl.java:15-23)
```java
/**
 * Реалізація BookService з використанням принципів SOLID:
 * - Single Responsibility: відповідає тільки за бізнес-логіку книг
 */
@Service
@Transactional
public class BookServiceImpl implements BookService {
    // Відповідає ТІЛЬКИ за бізнес-логіку операцій з книгами
    // Не займається HTTP запитами, валідацією, доступом до БД
}
```

**Причина для зміни:** Зміна бізнес-правил для операцій з книгами

**LoanServiceImpl.java** (backend/src/main/java/com/library/service/impl/LoanServiceImpl.java:21-27)
```java
/**
 * Реалізація LoanService з використанням принципів SOLID
 * - Single Responsibility: відповідає тільки за бізнес-логіку позик
 */
@Service
@Transactional
public class LoanServiceImpl implements LoanService {
    // Відповідає ТІЛЬКИ за бізнес-логіку позик
    // Розрахунок штрафів, перевірка доступності, управління статусами
}
```

**Причина для зміни:** Зміна бізнес-правил для позик (терміни, штрафи)

#### 1.2 Repository Layer

**BookRepository.java**
```java
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    // Відповідає ТІЛЬКИ за доступ до даних книг
    Optional<Book> findByIsbn(String isbn);
    List<Book> findByTitleContainingIgnoreCase(String title);
}
```

**Причина для зміни:** Зміна способу доступу до даних книг

#### 1.3 Controller Layer

**BookController.java**
```java
@RestController
@RequestMapping("/api/books")
public class BookController {
    // Відповідає ТІЛЬКИ за обробку HTTP запитів для книг
    // Не містить бізнес-логіки
}
```

**Причина для зміни:** Зміна API endpoints або HTTP специфікації

#### 1.4 Mapper Layer

**BookMapper.java**
```java
@Component
public class BookMapper {
    // Відповідає ТІЛЬКИ за конвертацію між Entity та DTO
    public BookDTO toDTO(Book book) { ... }
    public Book toEntity(BookDTO dto) { ... }
}
```

**Причина для зміни:** Зміна структури DTO або Entity

#### 1.5 Model Layer

**Book.java** (backend/src/main/java/com/library/model/Book.java:15-98)
```java
@Entity
@Table(name = "books")
public class Book {
    // Відповідає ТІЛЬКИ за представлення сутності книги
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String isbn;
    private String title;
    // ... інші поля

    public boolean isAvailable() {
        return availableCopies > 0 && status == BookStatus.AVAILABLE;
    }
}
```

**Причина для зміни:** Зміна структури даних книги

### Переваги SRP в проекті

1. **Легкість тестування:** Кожен клас тестується незалежно
2. **Простота підтримки:** Зміни в одній частині не впливають на інші
3. **Кращий розподіл відповідальності:** Чітко визначено, що робить кожен клас
4. **Повторне використання:** Класи можна використовувати в різних контекстах

---

## 2. Open/Closed Principle (OCP)

> Класи повинні бути відкриті для розширення, але закриті для модифікації

### Реалізація в проекті

#### 2.1 Використання інтерфейсів

**BookService Interface**
```java
public interface BookService {
    BookDTO createBook(BookDTO bookDTO);
    BookDTO getBookById(Long id);
    List<BookDTO> getAllBooks();
    // ... інші методи
}
```

**Розширення без модифікації:**
```java
// Можна створити нову реалізацію без зміни існуючого коду
@Service
public class CachedBookServiceImpl implements BookService {
    private final BookService delegate;
    private final Cache cache;

    // Додає кешування без зміни BookServiceImpl
}
```

#### 2.2 Spring Data JPA Repository

```java
public interface BookRepository extends JpaRepository<Book, Long> {
    // JpaRepository надає базові CRUD операції
    // Ми розширюємо функціональність без модифікації базового класу

    @Query("SELECT b FROM Book b JOIN b.authors a WHERE ...")
    List<Book> findByAuthorName(String authorName);
}
```

#### 2.3 Strategy Pattern для штрафів

**Поточна реалізація:**
```java
public class LoanServiceImpl {
    private static final BigDecimal FINE_PER_DAY = new BigDecimal("5.00");

    // Розрахунок штрафу
    if (loan.isOverdue()) {
        long daysOverdue = loan.getDaysOverdue();
        BigDecimal fine = FINE_PER_DAY.multiply(new BigDecimal(daysOverdue));
        loan.setFineAmount(fine);
    }
}
```

**Можливе розширення (без зміни існуючого коду):**
```java
// Інтерфейс стратегії
public interface FineCalculationStrategy {
    BigDecimal calculateFine(Loan loan);
}

// Різні стратегії
public class LinearFineStrategy implements FineCalculationStrategy {
    public BigDecimal calculateFine(Loan loan) {
        return new BigDecimal("5.00").multiply(new BigDecimal(loan.getDaysOverdue()));
    }
}

public class ProgressiveFineStrategy implements FineCalculationStrategy {
    public BigDecimal calculateFine(Loan loan) {
        long days = loan.getDaysOverdue();
        if (days <= 7) return new BigDecimal("5.00").multiply(new BigDecimal(days));
        else return new BigDecimal("10.00").multiply(new BigDecimal(days - 7))
                    .add(new BigDecimal("35.00"));
    }
}
```

#### 2.4 Exception Handling

```java
// Базовий exception
public class LibraryException extends RuntimeException {
    public LibraryException(String message) {
        super(message);
    }
}

// Розширення без модифікації базового класу
public class ResourceNotFoundException extends LibraryException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

public class BookNotAvailableException extends LibraryException {
    public BookNotAvailableException(String message) {
        super(message);
    }
}
```

### Переваги OCP в проекті

1. **Стабільність коду:** Існуючий код не змінюється при додаванні функцій
2. **Безпечне розширення:** Нові функції не ламають існуючі
3. **Модульність:** Легко додавати нові модулі

---

## 3. Liskov Substitution Principle (LSP)

> Об'єкти підкласів повинні коректно замінювати об'єкти базових класів

### Реалізація в проекті

#### 3.1 Service Implementations

```java
// Базовий інтерфейс
public interface BookService {
    BookDTO createBook(BookDTO bookDTO);
    BookDTO getBookById(Long id);
}

// Реалізація 1
@Service
public class BookServiceImpl implements BookService {
    @Override
    public BookDTO createBook(BookDTO bookDTO) {
        Book book = bookMapper.toEntity(bookDTO);
        Book savedBook = bookRepository.save(book);
        return bookMapper.toDTO(savedBook);
    }
}

// Можлива реалізація 2 (з кешуванням)
@Service
public class CachedBookServiceImpl implements BookService {
    @Override
    public BookDTO createBook(BookDTO bookDTO) {
        BookDTO result = delegate.createBook(bookDTO);
        cache.put(result.getId(), result);
        return result;
    }
}
```

**Принцип LSP дотримано:** Обидві реалізації можна використовувати взаємозамінно:

```java
@RestController
public class BookController {
    private final BookService bookService; // Може бути будь-яка реалізація

    @PostMapping
    public BookDTO createBook(@RequestBody BookDTO bookDTO) {
        return bookService.createBook(bookDTO); // Працює з будь-якою реалізацією
    }
}
```

#### 3.2 JPA Repositories

```java
// Всі репозиторії можуть замінити JpaRepository
public interface BookRepository extends JpaRepository<Book, Long> { }
public interface LoanRepository extends JpaRepository<Loan, Long> { }
public interface UserRepository extends JpaRepository<User, Long> { }

// Код працює з будь-яким репозиторієм
public <T, ID> void saveEntity(JpaRepository<T, ID> repository, T entity) {
    repository.save(entity);
}
```

#### 3.3 Model Enums

```java
// Всі статуси дотримуються контракту enum
public enum BookStatus { AVAILABLE, CHECKED_OUT, RESERVED, MAINTENANCE, LOST }
public enum LoanStatus { ACTIVE, RETURNED, OVERDUE, LOST }
public enum UserStatus { ACTIVE, SUSPENDED, INACTIVE }

// Можна використовувати однаково
public void setStatus(Enum<?> status) {
    // Працює з будь-яким enum статусом
}
```

### Порушення LSP (приклад чого НЕ робити)

```java
// ❌ ПОГАНО - порушення LSP
public class ReadOnlyBookService implements BookService {
    @Override
    public BookDTO createBook(BookDTO bookDTO) {
        throw new UnsupportedOperationException("Cannot create books in read-only mode");
        // Це порушує очікувану поведінку BookService
    }
}
```

### Переваги LSP в проекті

1. **Взаємозамінність:** Будь-яку реалізацію можна замінити іншою
2. **Полімофізм:** Код працює з абстракціями, а не конкретними реалізаціями
3. **Тестування:** Легко створювати mock/stub реалізації для тестів

---

## 4. Interface Segregation Principle (ISP)

> Клієнти не повинні залежати від інтерфейсів, які вони не використовують

### Реалізація в проекті

#### 4.1 Розділені сервісні інтерфейси

```java
// ✅ ДОБРЕ - кожен сервіс має власний інтерфейс
public interface BookService {
    BookDTO createBook(BookDTO bookDTO);
    BookDTO getBookById(Long id);
    List<BookDTO> searchBooksByTitle(String title);
    // Тільки методи для роботи з книгами
}

public interface LoanService {
    LoanDTO createLoan(Long userId, Long bookId);
    LoanDTO returnBook(Long loanId);
    List<LoanDTO> getOverdueLoans();
    // Тільки методи для роботи з позиками
}

public interface UserService {
    UserDTO createUser(UserDTO userDTO);
    UserDTO getUserById(Long id);
    // Тільки методи для роботи з користувачами
}
```

**Замість одного великого інтерфейсу:**
```java
// ❌ ПОГАНО - порушення ISP
public interface LibraryService {
    // Методи для книг
    BookDTO createBook(BookDTO bookDTO);
    BookDTO getBookById(Long id);

    // Методи для позик
    LoanDTO createLoan(Long userId, Long bookId);
    LoanDTO returnBook(Long loanId);

    // Методи для користувачів
    UserDTO createUser(UserDTO userDTO);
    UserDTO getUserById(Long id);

    // Клієнти змушені залежати від методів, які вони не використовують
}
```

#### 4.2 Специфічні Repository інтерфейси

```java
// Кожен repository має тільки методи для своєї сутності
public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByIsbn(String isbn);
    List<Book> findByTitleContainingIgnoreCase(String title);
    @Query("SELECT b FROM Book b JOIN b.authors a WHERE ...")
    List<Book> findByAuthorName(String authorName);
}

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUserId(Long userId);
    List<Loan> findByBookId(Long bookId);
    @Query("SELECT l FROM Loan l WHERE l.status = 'ACTIVE' AND l.dueDate < :date")
    List<Loan> findOverdueLoans(LocalDate date);
}
```

#### 4.3 DTO Classes

```java
// Кожен DTO містить тільки необхідні поля для свого use case
public class BookDTO {
    private Long id;
    private String isbn;
    private String title;
    // ... тільки поля книги
}

public class LoanDTO {
    private Long id;
    private Long userId;
    private Long bookId;
    private LocalDate loanDate;
    // ... тільки поля позики
}

// Замість одного великого DTO
// ❌ ПОГАНО
public class LibraryDTO {
    // Поля книги
    private String isbn;
    private String title;

    // Поля позики
    private LocalDate loanDate;
    private LocalDate dueDate;

    // Поля користувача
    private String username;
    private String email;

    // Клієнти отримують поля, які їм не потрібні
}
```

#### 4.4 Controller Endpoints

```java
// Кожен контролер відповідає за свою область
@RestController
@RequestMapping("/api/books")
public class BookController {
    // Тільки endpoints для книг
}

@RestController
@RequestMapping("/api/loans")
public class LoanController {
    // Тільки endpoints для позик
}

@RestController
@RequestMapping("/api/users")
public class UserController {
    // Тільки endpoints для користувачів
}
```

### Переваги ISP в проекті

1. **Менше залежностей:** Клас залежить тільки від того, що використовує
2. **Простіші інтерфейси:** Легше розуміти та використовувати
3. **Кращий розділ відповідальностей:** Кожен інтерфейс має чітку мету
4. **Легше рефакторинг:** Зміни в одному інтерфейсі не впливають на інші

---

## 5. Dependency Inversion Principle (DIP)

> Високорівневі модулі не повинні залежати від низькорівневих. Обидва повинні залежати від абстракцій

### Реалізація в проекті

#### 5.1 Constructor Injection

**BookServiceImpl.java** (backend/src/main/java/com/library/service/impl/BookServiceImpl.java:26-33)
```java
@Service
@Transactional
public class BookServiceImpl implements BookService {

    // Залежить від абстракцій (інтерфейсів), а не конкретних реалізацій
    private final BookRepository bookRepository;  // Інтерфейс
    private final BookMapper bookMapper;          // Інтерфейс або абстракція

    // Constructor Injection - Spring надає конкретні реалізації
    public BookServiceImpl(BookRepository bookRepository, BookMapper bookMapper) {
        this.bookRepository = bookRepository;
        this.bookMapper = bookMapper;
    }
}
```

**LoanServiceImpl.java** (backend/src/main/java/com/library/service/impl/LoanServiceImpl.java:32-48)
```java
@Service
@Transactional
public class LoanServiceImpl implements LoanService {

    // Всі залежності - це абстракції
    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BookService bookService;        // Інтерфейс, не реалізація
    private final LoanMapper loanMapper;

    public LoanServiceImpl(LoanRepository loanRepository,
                          UserRepository userRepository,
                          BookRepository bookRepository,
                          BookService bookService,
                          LoanMapper loanMapper) {
        this.loanRepository = loanRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.bookService = bookService;
        this.loanMapper = loanMapper;
    }
}
```

#### 5.2 Діаграма залежностей

```
┌─────────────────────────────────────────────────┐
│           HIGH-LEVEL MODULE                      │
│         BookController (REST API)                │
│                                                   │
│   @Autowired                                      │
│   private BookService bookService; ◄─────────┐   │
└───────────────────────────────────────────────┘   │
                    │                               │
                    │ залежить від                  │
                    ▼                               │
┌─────────────────────────────────────────────────┐   │
│              ABSTRACTION                          │   │
│        public interface BookService               │   │
│        {                                          │   │
│            BookDTO createBook(...);               │   │
│            BookDTO getBookById(...);              │   │
│        }                                          │   │
└───────────────────────────────────────────────────┘   │
                    ▲                                   │
                    │ імплементує                       │
                    │                                   │
┌───────────────────────────────────────────────────┐   │
│           LOW-LEVEL MODULE                          │   │
│      @Service                                       │   │
│      public class BookServiceImpl                   │   │
│            implements BookService                   │   │
│      {                                              │   │
│          private final BookRepository repo; ────────┼───┘
│          private final BookMapper mapper;           │
│      }                                              │
└─────────────────────────────────────────────────────┘
```

#### 5.3 Spring Data JPA Repository

```java
// Абстракція
public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByIsbn(String isbn);
}

// Spring автоматично створює реалізацію
// Наш код ніколи не залежить від конкретної реалізації
```

#### 5.4 Приклад порушення DIP (чого НЕ робити)

```java
// ❌ ПОГАНО - залежність від конкретної реалізації
@Service
public class LoanServiceImpl implements LoanService {

    // Створення залежності всередині класу
    private LoanRepositoryImpl loanRepository = new LoanRepositoryImpl();

    // Важко тестувати, важко замінити реалізацію
}
```

```java
// ✅ ДОБРЕ - залежність від абстракції через injection
@Service
public class LoanServiceImpl implements LoanService {

    private final LoanRepository loanRepository;

    public LoanServiceImpl(LoanRepository loanRepository) {
        this.loanRepository = loanRepository;
    }
}
```

#### 5.5 Тестування з DIP

Завдяки DIP легко писати unit тести:

```java
@Test
public void testCreateBook() {
    // Mock залежностей
    BookRepository mockRepository = mock(BookRepository.class);
    BookMapper mockMapper = mock(BookMapper.class);

    // Створення сервісу з mock залежностями
    BookService service = new BookServiceImpl(mockRepository, mockMapper);

    // Тестування
    when(mockRepository.save(any())).thenReturn(book);
    BookDTO result = service.createBook(bookDTO);

    verify(mockRepository).save(any());
}
```

### Переваги DIP в проекті

1. **Слабке зв'язування:** Високорівневі модулі не залежать від деталей реалізації
2. **Тестованість:** Легко замінити залежності на mock об'єкти
3. **Гнучкість:** Можна легко змінити реалізацію без зміни клієнтського коду
4. **Повторне використання:** Модулі можна використовувати з різними реалізаціями

---

## Висновок

Всі п'ять SOLID принципів послідовно застосовані в проекті:

| Принцип | Реалізація | Переваги |
|---------|-----------|----------|
| **SRP** | Розділення на Controller, Service, Repository, Mapper, Model | Простота підтримки, тестування |
| **OCP** | Використання інтерфейсів, Spring Data JPA | Розширюваність без модифікації |
| **LSP** | Правильна ієрархія наслідування, реалізація інтерфейсів | Взаємозамінність компонентів |
| **ISP** | Специфічні інтерфейси для кожної сутності | Мінімальні залежності |
| **DIP** | Constructor Injection, залежність від абстракцій | Слабке зв'язування, тестованість |

Ці принципи забезпечують:
- **Високу якість коду**
- **Простоту підтримки та розширення**
- **Легкість тестування**
- **Гнучку архітектуру**
