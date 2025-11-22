# Патерни проектування - Система керування бібліотекою

## Зміст

1. [Repository Pattern](#1-repository-pattern)
2. [Service Layer Pattern](#2-service-layer-pattern)
3. [Data Transfer Object (DTO) Pattern](#3-data-transfer-object-dto-pattern)
4. [Adapter (Mapper) Pattern](#4-adapter-mapper-pattern)
5. [Strategy Pattern](#5-strategy-pattern)
6. [Dependency Injection Pattern](#6-dependency-injection-pattern)
7. [Model-View-Controller (MVC) Pattern](#7-model-view-controller-mvc-pattern)
8. [Builder Pattern](#8-builder-pattern)
9. [Singleton Pattern](#9-singleton-pattern)
10. [Template Method Pattern](#10-template-method-pattern)

---

## 1. Repository Pattern

### Призначення
Абстрагує логіку доступу до даних від бізнес-логіки, надає колекційно-подібний інтерфейс для доступу до даних.

### Реалізація в проекті

#### BookRepository.java
```java
package com.library.repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    // Базові CRUD операції успадковані від JpaRepository:
    // save(), findById(), findAll(), delete(), etc.

    // Кастомні методи пошуку
    Optional<Book> findByIsbn(String isbn);

    List<Book> findByTitleContainingIgnoreCase(String title);

    @Query("SELECT b FROM Book b JOIN b.authors a " +
           "WHERE LOWER(a.firstName) LIKE LOWER(CONCAT('%', :name, '%')) " +
           "OR LOWER(a.lastName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Book> findByAuthorName(@Param("name") String authorName);

    @Query("SELECT b FROM Book b JOIN b.categories c " +
           "WHERE LOWER(c.name) = LOWER(:categoryName)")
    List<Book> findByCategoryName(@Param("categoryName") String categoryName);

    @Query("SELECT b FROM Book b WHERE b.availableCopies > 0 AND b.status = 'AVAILABLE'")
    List<Book> findAvailableBooks();
}
```

#### LoanRepository.java
```java
@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByUserId(Long userId);

    List<Loan> findByBookId(Long bookId);

    @Query("SELECT l FROM Loan l WHERE l.user.id = :userId AND l.status = 'ACTIVE'")
    Long countActiveLoansByUserId(@Param("userId") Long userId);

    @Query("SELECT l FROM Loan l WHERE l.status = 'ACTIVE' AND l.dueDate < :date")
    List<Loan> findOverdueLoans(@Param("date") LocalDate date);
}
```

### Переваги

1. **Інкапсуляція логіки доступу до даних:** Вся логіка роботи з БД в одному місці
2. **Тестованість:** Легко замінити на mock для тестування
3. **Централізація запитів:** Всі складні запити знаходяться в репозиторіях
4. **Абстракція від деталей реалізації:** Можна змінити БД без зміни бізнес-логіки

### Діаграма

```
┌──────────────────────┐
│   BookServiceImpl    │
│                      │
│   +createBook()      │
│   +getBookById()     │
└──────────┬───────────┘
           │ використовує
           ▼
┌──────────────────────┐
│   BookRepository     │◄───── Repository Pattern
│   (Interface)        │
│                      │
│   +save()            │
│   +findById()        │
│   +findByIsbn()      │
└──────────┬───────────┘
           │ extends
           ▼
┌──────────────────────┐
│   JpaRepository      │
│   (Spring Data JPA)  │
│                      │
│   Автоматична        │
│   реалізація         │
└──────────────────────┘
```

---

## 2. Service Layer Pattern

### Призначення
Відокремлює бізнес-логіку від інших шарів додатку (презентаційного та доступу до даних).

### Реалізація в проекті

#### BookService Interface
```java
package com.library.service;

public interface BookService {
    BookDTO createBook(BookDTO bookDTO);
    BookDTO getBookById(Long id);
    BookDTO getBookByIsbn(String isbn);
    List<BookDTO> getAllBooks();
    List<BookDTO> searchBooksByTitle(String title);
    List<BookDTO> searchBooksByAuthor(String authorName);
    List<BookDTO> searchBooksByCategory(String categoryName);
    List<BookDTO> getAvailableBooks();
    BookDTO updateBook(Long id, BookDTO bookDTO);
    void deleteBook(Long id);
    void updateBookAvailability(Long bookId, int change);
}
```

#### BookServiceImpl
```java
@Service
@Transactional
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final BookMapper bookMapper;

    public BookServiceImpl(BookRepository bookRepository, BookMapper bookMapper) {
        this.bookRepository = bookRepository;
        this.bookMapper = bookMapper;
    }

    @Override
    public BookDTO createBook(BookDTO bookDTO) {
        // Бізнес-логіка створення книги
        Book book = bookMapper.toEntity(bookDTO);
        Book savedBook = bookRepository.save(book);
        return bookMapper.toDTO(savedBook);
    }

    @Override
    public void updateBookAvailability(Long bookId, int change) {
        // Бізнес-правило: перевірка доступності
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        int newAvailability = book.getAvailableCopies() + change;
        if (newAvailability < 0) {
            throw new RuntimeException("Not enough available copies");
        }

        book.setAvailableCopies(newAvailability);
        bookRepository.save(book);
    }
}
```

#### LoanServiceImpl (з бізнес-правилами)
```java
@Service
@Transactional
public class LoanServiceImpl implements LoanService {

    private static final int DEFAULT_LOAN_PERIOD_DAYS = 14;
    private static final BigDecimal FINE_PER_DAY = new BigDecimal("5.00");

    @Override
    public LoanDTO createLoan(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        // Бізнес-правило 1: Перевірка ліміту позик
        long activeLoans = loanRepository.countActiveLoansByUserId(userId);
        if (activeLoans >= user.getMaxLoans()) {
            throw new RuntimeException("User has reached maximum loan limit");
        }

        // Бізнес-правило 2: Перевірка доступності
        if (!book.isAvailable()) {
            throw new RuntimeException("Book is not available");
        }

        // Створення позики
        Loan loan = new Loan();
        loan.setUser(user);
        loan.setBook(book);
        loan.setLoanDate(LocalDate.now());
        loan.setDueDate(LocalDate.now().plusDays(DEFAULT_LOAN_PERIOD_DAYS));
        loan.setStatus(Loan.LoanStatus.ACTIVE);

        Loan savedLoan = loanRepository.save(loan);

        // Оновлення доступності книги
        bookService.updateBookAvailability(bookId, -1);

        return loanMapper.toDTO(savedLoan);
    }

    @Override
    public LoanDTO returnBook(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        // Бізнес-правило: розрахунок штрафу
        if (loan.isOverdue()) {
            long daysOverdue = loan.getDaysOverdue();
            BigDecimal fine = FINE_PER_DAY.multiply(new BigDecimal(daysOverdue));
            loan.setFineAmount(fine);
        }

        loan.setReturnDate(LocalDate.now());
        loan.setStatus(Loan.LoanStatus.RETURNED);

        Loan updatedLoan = loanRepository.save(loan);

        // Оновлення доступності книги
        bookService.updateBookAvailability(loan.getBook().getId(), 1);

        return loanMapper.toDTO(updatedLoan);
    }
}
```

### Переваги

1. **Централізація бізнес-логіки:** Всі бізнес-правила в одному місці
2. **Повторне використання:** Сервісні методи можуть використовуватись різними контролерами
3. **Транзакційність:** `@Transactional` забезпечує консистентність даних
4. **Незалежність від UI:** Бізнес-логіка не залежить від способу представлення

---

## 3. Data Transfer Object (DTO) Pattern

### Призначення
Передача даних між шарами додатку без експозиції внутрішньої структури entity.

### Реалізація в проекті

#### BookDTO.java
```java
package com.library.dto;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookDTO {
    private Long id;
    private String isbn;
    private String title;
    private String description;
    private LocalDate publishDate;
    private String publisher;
    private Integer pageCount;
    private String language;
    private Integer totalCopies;
    private Integer availableCopies;
    private Book.BookStatus status;

    // DTO містить List<String> замість складних об'єктів
    private List<String> authors;
    private List<String> categories;
}
```

#### LoanDTO.java
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanDTO {
    private Long id;
    private Long userId;
    private String username;
    private Long bookId;
    private String bookTitle;
    private LocalDate loanDate;
    private LocalDate dueDate;
    private LocalDate returnDate;
    private Loan.LoanStatus status;
    private BigDecimal fineAmount;
    private String notes;
}
```

### Порівняння Entity vs DTO

```java
// Entity - містить зв'язки JPA
@Entity
public class Book {
    @Id
    private Long id;

    @ManyToMany
    @JoinTable(...)
    private Set<Author> authors;  // Складний об'єкт з JPA зв'язками

    @OneToMany
    private Set<Loan> loans;  // Може викликати LazyInitializationException
}

// DTO - прості дані для передачі
public class BookDTO {
    private Long id;
    private List<String> authors;  // Просто список імен
    // Немає зв'язків JPA
}
```

### Переваги

1. **Безпека:** Не експонує внутрішню структуру entity
2. **Продуктивність:** Можна передавати тільки необхідні дані
3. **Незалежність від ORM:** DTO не містить JPA анотацій
4. **Гнучкість:** Різні DTO для різних use cases

---

## 4. Adapter (Mapper) Pattern

### Призначення
Конвертація між несумісними інтерфейсами (Entity ↔ DTO).

### Реалізація в проекті

#### BookMapper.java
```java
package com.library.mapper;

@Component
public class BookMapper {

    // Entity → DTO
    public BookDTO toDTO(Book book) {
        if (book == null) {
            return null;
        }

        BookDTO dto = new BookDTO();
        dto.setId(book.getId());
        dto.setIsbn(book.getIsbn());
        dto.setTitle(book.getTitle());
        dto.setDescription(book.getDescription());
        dto.setPublishDate(book.getPublishDate());
        dto.setPublisher(book.getPublisher());
        dto.setPageCount(book.getPageCount());
        dto.setLanguage(book.getLanguage());
        dto.setTotalCopies(book.getTotalCopies());
        dto.setAvailableCopies(book.getAvailableCopies());
        dto.setStatus(book.getStatus());

        // Конвертація складних об'єктів в прості списки
        if (book.getAuthors() != null) {
            dto.setAuthors(book.getAuthors().stream()
                    .map(author -> author.getFirstName() + " " + author.getLastName())
                    .collect(Collectors.toList()));
        }

        if (book.getCategories() != null) {
            dto.setCategories(book.getCategories().stream()
                    .map(Category::getName)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    // DTO → Entity
    public Book toEntity(BookDTO dto) {
        if (dto == null) {
            return null;
        }

        Book book = new Book();
        book.setId(dto.getId());
        book.setIsbn(dto.getIsbn());
        book.setTitle(dto.getTitle());
        book.setDescription(dto.getDescription());
        book.setPublishDate(dto.getPublishDate());
        book.setPublisher(dto.getPublisher());
        book.setPageCount(dto.getPageCount());
        book.setLanguage(dto.getLanguage());
        book.setTotalCopies(dto.getTotalCopies());
        book.setAvailableCopies(dto.getAvailableCopies());
        book.setStatus(dto.getStatus());

        return book;
    }
}
```

#### LoanMapper.java
```java
@Component
public class LoanMapper {

    public LoanDTO toDTO(Loan loan) {
        if (loan == null) {
            return null;
        }

        LoanDTO dto = new LoanDTO();
        dto.setId(loan.getId());
        dto.setLoanDate(loan.getLoanDate());
        dto.setDueDate(loan.getDueDate());
        dto.setReturnDate(loan.getReturnDate());
        dto.setStatus(loan.getStatus());
        dto.setFineAmount(loan.getFineAmount());
        dto.setNotes(loan.getNotes());

        // Додавання інформації з пов'язаних entity
        if (loan.getUser() != null) {
            dto.setUserId(loan.getUser().getId());
            dto.setUsername(loan.getUser().getUsername());
        }

        if (loan.getBook() != null) {
            dto.setBookId(loan.getBook().getId());
            dto.setBookTitle(loan.getBook().getTitle());
        }

        return dto;
    }
}
```

### Діаграма Adapter Pattern

```
┌─────────────┐              ┌─────────────┐
│   Book      │              │  BookDTO    │
│  (Entity)   │              │             │
├─────────────┤              ├─────────────┤
│ - id        │              │ - id        │
│ - isbn      │              │ - isbn      │
│ - authors   │◄─────────────┤ - authors   │
│   Set<>     │  BookMapper  │   List<>    │
└─────────────┘              └─────────────┘
      ▲                              │
      │                              │
      │      ┌──────────────┐        │
      │      │ BookMapper   │        │
      │      ├──────────────┤        │
      └──────┤ toEntity()   ├────────┘
             │ toDTO()      │
             └──────────────┘
```

### Переваги

1. **Розділення відповідальностей:** Entity для БД, DTO для передачі даних
2. **Адаптація інтерфейсів:** Різні структури даних для різних шарів
3. **Контроль над даними:** Точне управління тим, які дані передаються
4. **Тестованість:** Легко тестувати конвертацію

---

## 5. Strategy Pattern

### Призначення
Визначає сімейство алгоритмів, інкапсулює кожен з них і робить їх взаємозамінними.

### Реалізація в проекті

#### Розрахунок штрафів (Fine Calculation)

**Поточна реалізація (LoanServiceImpl.java:138-142)**
```java
// Простий алгоритм розрахунку штрафу
if (loan.isOverdue()) {
    long daysOverdue = loan.getDaysOverdue();
    BigDecimal fine = FINE_PER_DAY.multiply(new BigDecimal(daysOverdue));
    loan.setFineAmount(fine);
}
```

**Розширена реалізація з Strategy Pattern:**

```java
// Інтерфейс стратегії
public interface FineCalculationStrategy {
    BigDecimal calculateFine(Loan loan);
}

// Стратегія 1: Лінійний розрахунок
@Component("linearFineStrategy")
public class LinearFineStrategy implements FineCalculationStrategy {
    private static final BigDecimal FINE_PER_DAY = new BigDecimal("5.00");

    @Override
    public BigDecimal calculateFine(Loan loan) {
        if (!loan.isOverdue()) {
            return BigDecimal.ZERO;
        }
        long daysOverdue = loan.getDaysOverdue();
        return FINE_PER_DAY.multiply(new BigDecimal(daysOverdue));
    }
}

// Стратегія 2: Прогресивний розрахунок
@Component("progressiveFineStrategy")
public class ProgressiveFineStrategy implements FineCalculationStrategy {

    @Override
    public BigDecimal calculateFine(Loan loan) {
        if (!loan.isOverdue()) {
            return BigDecimal.ZERO;
        }

        long days = loan.getDaysOverdue();

        // Перший тиждень: 5 грн/день
        if (days <= 7) {
            return new BigDecimal("5.00").multiply(new BigDecimal(days));
        }

        // Після тижня: 10 грн/день
        BigDecimal firstWeek = new BigDecimal("35.00"); // 7 * 5
        BigDecimal additionalDays = new BigDecimal(days - 7);
        BigDecimal additionalFine = new BigDecimal("10.00").multiply(additionalDays);

        return firstWeek.add(additionalFine);
    }
}

// Стратегія 3: Максимальний штраф
@Component("cappedFineStrategy")
public class CappedFineStrategy implements FineCalculationStrategy {
    private static final BigDecimal FINE_PER_DAY = new BigDecimal("5.00");
    private static final BigDecimal MAX_FINE = new BigDecimal("100.00");

    @Override
    public BigDecimal calculateFine(Loan loan) {
        if (!loan.isOverdue()) {
            return BigDecimal.ZERO;
        }

        long daysOverdue = loan.getDaysOverdue();
        BigDecimal calculated = FINE_PER_DAY.multiply(new BigDecimal(daysOverdue));

        // Обмеження максимального штрафу
        return calculated.min(MAX_FINE);
    }
}

// Використання стратегії в сервісі
@Service
public class LoanServiceImpl implements LoanService {

    private final FineCalculationStrategy fineStrategy;

    public LoanServiceImpl(
            @Qualifier("linearFineStrategy") FineCalculationStrategy fineStrategy) {
        this.fineStrategy = fineStrategy;
    }

    @Override
    public LoanDTO returnBook(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        // Використання стратегії
        BigDecimal fine = fineStrategy.calculateFine(loan);
        loan.setFineAmount(fine);

        // ... решта логіки
    }
}
```

### Діаграма Strategy Pattern

```
┌─────────────────────────────┐
│    LoanServiceImpl          │
│                             │
│  - fineStrategy             │◄──────────┐
│                             │           │
│  + returnBook()             │           │
│    {                        │           │
│      fine = fineStrategy    │           │
│             .calculateFine()│           │
│    }                        │           │
└─────────────────────────────┘           │
                                          │
                                          │
┌─────────────────────────────────────────┘
│
│  <<interface>>
│  FineCalculationStrategy
│  ┌───────────────────────────┐
│  │ +calculateFine(loan)      │
│  └───────────────────────────┘
│           ▲         ▲         ▲
│           │         │         │
├───────────┤         │         │
│           │         │         │
│  ┌────────┴──────┐ │ ┌───────┴────────┐
│  │Linear         │ │ │Progressive     │
│  │FineStrategy   │ │ │FineStrategy    │
│  └───────────────┘ │ └────────────────┘
│                    │
│          ┌─────────┴────────┐
│          │Capped            │
│          │FineStrategy      │
│          └──────────────────┘
```

### Переваги

1. **Гнучкість:** Легко додавати нові алгоритми
2. **Заміна в runtime:** Можна міняти стратегію динамічно
3. **Відокремлення алгоритмів:** Кожен алгоритм в окремому класі
4. **Open/Closed Principle:** Додавання нових стратегій без зміни існуючого коду

---

## 6. Dependency Injection Pattern

### Призначення
Інверсія контролю - залежності надаються ззовні, а не створюються всередині класу.

### Реалізація в проекті (Spring Framework)

#### Constructor Injection (рекомендований підхід)

```java
@Service
@Transactional
public class BookServiceImpl implements BookService {

    // Залежності оголошені як final - immutable
    private final BookRepository bookRepository;
    private final BookMapper bookMapper;

    // Constructor Injection через конструктор
    public BookServiceImpl(BookRepository bookRepository, BookMapper bookMapper) {
        this.bookRepository = bookRepository;
        this.bookMapper = bookMapper;
    }

    // Використання залежностей
    @Override
    public BookDTO createBook(BookDTO bookDTO) {
        Book book = bookMapper.toEntity(bookDTO);
        Book savedBook = bookRepository.save(book);
        return bookMapper.toDTO(savedBook);
    }
}
```

#### Приклад з багатьма залежностями (LoanServiceImpl)

```java
@Service
@Transactional
public class LoanServiceImpl implements LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BookService bookService;
    private final LoanMapper loanMapper;

    // Всі залежності ін'єктуються через конструктор
    public LoanServiceImpl(
            LoanRepository loanRepository,
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

#### Spring IoC Container

```java
@Configuration
public class AppConfig {

    // Spring автоматично створює beans і керує їх життєвим циклом

    @Bean
    public BookService bookService(BookRepository repository, BookMapper mapper) {
        return new BookServiceImpl(repository, mapper);
    }

    // Або використовується @ComponentScan для автоматичного виявлення:
    // @Service, @Repository, @Component
}
```

### Типи Injection

```java
// 1. Constructor Injection (найкращий підхід)
@Service
public class BookServiceImpl {
    private final BookRepository repository;

    public BookServiceImpl(BookRepository repository) {
        this.repository = repository;
    }
}

// 2. Field Injection (не рекомендується)
@Service
public class BookServiceImpl {
    @Autowired
    private BookRepository repository;  // Не можна зробити final
}

// 3. Setter Injection (опціональні залежності)
@Service
public class BookServiceImpl {
    private BookRepository repository;

    @Autowired
    public void setRepository(BookRepository repository) {
        this.repository = repository;
    }
}
```

### Переваги

1. **Тестованість:** Легко підставити mock залежності
2. **Слабке зв'язування:** Компоненти не створюють свої залежності
3. **Гнучкість:** Можна легко змінити реалізацію
4. **Immutability:** Constructor injection дозволяє final поля

---

## 7. Model-View-Controller (MVC) Pattern

### Призначення
Розділення логіки додатку на три компоненти: модель, представлення та контролер.

### Реалізація в проекті

```
Backend (Spring MVC)              Frontend (React)
┌─────────────────┐              ┌─────────────────┐
│   Controller    │              │      View       │
│                 │              │   (Components)  │
│  BookController │◄────HTTP────►│  BookList.js    │
│  LoanController │              │  LoanList.js    │
└────────┬────────┘              └────────┬────────┘
         │                                │
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│     Model       │              │   Services      │
│  (Service Layer)│              │                 │
│  BookService    │              │  bookService.js │
│  LoanService    │              │  loanService.js │
└────────┬────────┘              └─────────────────┘
         │
         ▼
┌─────────────────┐
│      Model      │
│    (Entities)   │
│      Book       │
│      Loan       │
└─────────────────┘
```

#### Controller (backend/src/main/java/com/library/controller/BookController.java)

```java
@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    // Обробка HTTP запитів
    @GetMapping
    public ResponseEntity<List<BookDTO>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDTO> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }

    @PostMapping
    public ResponseEntity<BookDTO> createBook(@RequestBody BookDTO bookDTO) {
        BookDTO created = bookService.createBook(bookDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookDTO> updateBook(
            @PathVariable Long id,
            @RequestBody BookDTO bookDTO) {
        return ResponseEntity.ok(bookService.updateBook(id, bookDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.noContent().build();
    }
}
```

#### Model (backend/src/main/java/com/library/model/Book.java)

```java
@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String isbn;
    private String title;
    private String description;
    // ... інші поля

    // Бізнес-логіка в моделі
    public boolean isAvailable() {
        return availableCopies > 0 && status == BookStatus.AVAILABLE;
    }
}
```

#### View (frontend/src/components/BookList.js)

```javascript
function BookList() {
  const [books, setBooks] = useState([]);
  const [searchType, setSearchType] = useState('title');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await bookService.getAllBooks();
      setBooks(response.data);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  return (
    <div className="book-list-container">
      <h1>Каталог книг</h1>
      <div className="search-bar">
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
          <option value="title">Назва</option>
          <option value="author">Автор</option>
        </select>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Пошук..."
        />
        <button onClick={handleSearch}>Шукати</button>
      </div>

      <div className="books-grid">
        {books.map(book => (
          <div key={book.id} className="book-card">
            <h3>{book.title}</h3>
            <p>ISBN: {book.isbn}</p>
            <p>Автори: {book.authors?.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Переваги

1. **Розділення відповідальностей:** Кожен компонент має чітку роль
2. **Паралельна розробка:** Frontend і Backend можуть розроблятись незалежно
3. **Повторне використання:** Model може використовуватись різними View
4. **Тестованість:** Кожен шар тестується окремо

---

## 8. Builder Pattern

### Призначення
Покрокове створення складних об'єктів.

### Реалізація в проекті (Lombok @Builder)

```java
@Entity
@Table(name = "loans")
@Data
@Builder  // Lombok генерує Builder автоматично
@NoArgsConstructor
@AllArgsConstructor
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate loanDate;
    private LocalDate dueDate;
    private Loan.LoanStatus status;
    private BigDecimal fineAmount;
}

// Використання Builder
Loan loan = Loan.builder()
    .user(user)
    .book(book)
    .loanDate(LocalDate.now())
    .dueDate(LocalDate.now().plusDays(14))
    .status(Loan.LoanStatus.ACTIVE)
    .fineAmount(BigDecimal.ZERO)
    .build();
```

### Переваги

1. **Читабельність:** Зрозуміло які поля встановлюються
2. **Immutability:** Можна створити immutable об'єкти
3. **Гнучкість:** Необов'язкові параметри легко пропускаються

---

## 9. Singleton Pattern

### Призначення
Забезпечує єдиний екземпляр класу в додатку.

### Реалізація в проекті (Spring Beans)

```java
// Spring бeани за замовчуванням є Singleton
@Service
public class BookServiceImpl implements BookService {
    // Тільки один екземпляр в ApplicationContext
}

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    // Тільки один екземпляр
}

// Явне вказання scope (за замовчуванням)
@Service
@Scope("singleton")
public class LoanServiceImpl implements LoanService {
    // ...
}
```

### Переваги

1. **Економія пам'яті:** Один екземпляр на весь додаток
2. **Глобальний доступ:** Доступ до єдиного екземпляру
3. **Контрольований доступ:** Spring керує життєвим циклом

---

## 10. Template Method Pattern

### Призначення
Визначає скелет алгоритму, дозволяючи підкласам перевизначати окремі кроки.

### Реалізація в проекті (Spring Data JPA)

```java
// JpaRepository використовує Template Method Pattern
public interface BookRepository extends JpaRepository<Book, Long> {

    // Spring Data надає template для CRUD операцій
    // Ми можемо додавати кастомні методи

    // Template method: Spring створює реалізацію
    List<Book> findByTitleContainingIgnoreCase(String title);

    // Або кастомний query
    @Query("SELECT b FROM Book b WHERE ...")
    List<Book> customMethod();
}
```

```java
// @Transactional використовує Template Method Pattern
@Service
public class BookServiceImpl {

    @Transactional  // Template: begin -> метод -> commit/rollback
    public BookDTO createBook(BookDTO bookDTO) {
        // Наш код виконується всередині транзакції
        Book book = bookMapper.toEntity(bookDTO);
        Book savedBook = bookRepository.save(book);
        return bookMapper.toDTO(savedBook);
    }
}
```

---

## Висновок

В проекті систематично застосовано наступні патерни проектування:

| Патерн | Локація | Переваги |
|--------|---------|----------|
| **Repository** | `repository/` package | Абстракція доступу до даних |
| **Service Layer** | `service/impl/` package | Централізація бізнес-логіки |
| **DTO** | `dto/` package | Безпека, гнучкість |
| **Adapter** | `mapper/` package | Конвертація Entity ↔ DTO |
| **Strategy** | Fine calculation | Взаємозамінність алгоритмів |
| **Dependency Injection** | Всі `@Service`, `@Repository` | Слабке зв'язування |
| **MVC** | Controller-Service-Model | Розділення відповідальностей |
| **Builder** | Lombok `@Builder` | Зручне створення об'єктів |
| **Singleton** | Spring Beans | Єдиний екземпляр |
| **Template Method** | Spring Data JPA, `@Transactional` | Повторне використання алгоритмів |

Ці патерни забезпечують:
- **Чистий код**
- **Легку підтримку**
- **Високу тестованість**
- **Масштабованість**
- **Гнучку архітектуру**
