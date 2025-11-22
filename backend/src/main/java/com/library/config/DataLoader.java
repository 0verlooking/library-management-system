package com.library.config;

import com.library.model.*;
import com.library.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Компонент для початкового заповнення бази даних тестовими даними
 */
@Component
public class DataLoader implements CommandLineRunner {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;

    public DataLoader(BookRepository bookRepository,
                     AuthorRepository authorRepository,
                     CategoryRepository categoryRepository,
                     UserRepository userRepository,
                     LoanRepository loanRepository) {
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.loanRepository = loanRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Перевірка, чи база вже заповнена
        if (bookRepository.count() > 0) {
            System.out.println("База даних вже містить дані. Пропускаємо ініціалізацію.");
            return;
        }

        System.out.println("Початкове заповнення бази даних...");

        // Створення категорій
        Category poetry = createCategory("Поезія", "Поетичні твори");
        Category prose = createCategory("Проза", "Прозові твори");
        Category classics = createCategory("Українська класика", "Класична українська література");
        Category drama = createCategory("Драматургія", "П'єси та драматичні твори");
        Category fiction = createCategory("Художня література", "Художні твори");

        // Створення авторів
        Author shevchenko = createAuthor("Тарас", "Шевченко",
            "Український поет, письменник, художник, громадський діяч",
            LocalDate.of(1814, 3, 9), "Українець");

        Author franko = createAuthor("Іван", "Франко",
            "Український письменник, поет, публіцист, перекладач, науковець, громадський діяч",
            LocalDate.of(1856, 8, 27), "Українець");

        Author kotsiubynsky = createAuthor("Михайло", "Коцюбинський",
            "Український письменник-новеліст і громадський діяч",
            LocalDate.of(1864, 9, 17), "Українець");

        Author ukrainka = createAuthor("Леся", "Українка",
            "Українська поетеса, письменниця, перекладачка, культурна діячка",
            LocalDate.of(1871, 2, 25), "Українка");

        Author nechuy = createAuthor("Іван", "Нечуй-Левицький",
            "Український письменник-реаліст",
            LocalDate.of(1838, 11, 25), "Українець");

        // Створення книг
        createBook(
            "978-966-03-4567-8",
            "Кобзар",
            "Збірка поезій Тараса Шевченка - найвидатніша пам'ятка української літератури",
            LocalDate.of(2019, 3, 9),
            "А-БА-БА-ГА-ЛАМАГА",
            320,
            "Українська",
            5,
            Set.of(shevchenko),
            Set.of(poetry, classics)
        );

        createBook(
            "978-966-441-123-4",
            "Захар Беркут",
            "Історичний роман Івана Франка про події XIII століття",
            LocalDate.of(2020, 1, 20),
            "Фоліо",
            256,
            "Українська",
            3,
            Set.of(franko),
            Set.of(prose, classics, fiction)
        );

        createBook(
            "978-617-12-3456-7",
            "Тіні забутих предків",
            "Шедевр української прози про кохання та гуцульський побут",
            LocalDate.of(2018, 6, 15),
            "Фоліо",
            192,
            "Українська",
            4,
            Set.of(kotsiubynsky),
            Set.of(prose, classics, fiction)
        );

        createBook(
            "978-966-10-5555-5",
            "Лісова пісня",
            "Драма-феєрія Лесі Українки",
            LocalDate.of(2021, 2, 25),
            "Знання",
            128,
            "Українська",
            3,
            Set.of(ukrainka),
            Set.of(drama, poetry, classics)
        );

        createBook(
            "978-617-7453-88-9",
            "Кайдашева сім'я",
            "Соціально-побутова повість про українське село",
            LocalDate.of(2019, 11, 10),
            "Школа",
            160,
            "Українська",
            6,
            Set.of(nechuy),
            Set.of(prose, classics, fiction)
        );

        createBook(
            "978-966-498-123-4",
            "Каменярі",
            "Поема Івана Франка про тяжку працю робітників",
            LocalDate.of(2020, 8, 27),
            "Веселка",
            96,
            "Українська",
            2,
            Set.of(franko),
            Set.of(poetry, classics)
        );

        createBook(
            "978-617-09-4321-1",
            "Intermezzo",
            "Збірка оповідань Михайла Коцюбинського",
            LocalDate.of(2021, 9, 17),
            "Фоліо",
            224,
            "Українська",
            3,
            Set.of(kotsiubynsky),
            Set.of(prose, fiction)
        );

        // Створення користувачів
        createUser("admin", "admin@library.com", "Адміністратор", "Системи",
                  User.UserRole.ADMIN, User.UserStatus.ACTIVE, 10);

        createUser("librarian1", "librarian@library.com", "Олена", "Книжник",
                  User.UserRole.LIBRARIAN, User.UserStatus.ACTIVE, 10);

        User reader1 = createUser("ivan_petrov", "ivan@example.com", "Іван", "Петров",
                                 User.UserRole.READER, User.UserStatus.ACTIVE, 5);

        User reader2 = createUser("maria_kovalenko", "maria@example.com", "Марія", "Коваленко",
                                 User.UserRole.READER, User.UserStatus.ACTIVE, 5);

        User reader3 = createUser("olena_shevchenko", "olena@example.com", "Олена", "Шевченко",
                                 User.UserRole.READER, User.UserStatus.ACTIVE, 5);

        // Створення тестових позик
        Book kobzar = bookRepository.findByIsbn("978-966-03-4567-8").orElse(null);
        Book zakhar = bookRepository.findByIsbn("978-966-441-123-4").orElse(null);
        Book tini = bookRepository.findByIsbn("978-617-12-3456-7").orElse(null);

        if (kobzar != null && reader1 != null) {
            createActiveLoan(reader1, kobzar, LocalDate.now().minusDays(5), 14);
        }

        if (zakhar != null && reader2 != null) {
            // Прострочена позика
            createActiveLoan(reader2, zakhar, LocalDate.now().minusDays(20), 14);
        }

        if (tini != null && reader3 != null) {
            // Повернена позика
            createReturnedLoan(reader3, tini, LocalDate.now().minusDays(15), 14, LocalDate.now().minusDays(1));
        }

        System.out.println("База даних успішно заповнена тестовими даними!");
        System.out.println("Створено: ");
        System.out.println("- Категорій: " + categoryRepository.count());
        System.out.println("- Авторів: " + authorRepository.count());
        System.out.println("- Книг: " + bookRepository.count());
        System.out.println("- Користувачів: " + userRepository.count());
        System.out.println("- Позик: " + loanRepository.count());
    }

    private Category createCategory(String name, String description) {
        // Перевірка чи категорія вже існує
        return categoryRepository.findByName(name).orElseGet(() -> {
            Category category = new Category();
            category.setName(name);
            category.setDescription(description);
            return categoryRepository.save(category);
        });
    }

    private Author createAuthor(String firstName, String lastName, String biography,
                               LocalDate birthDate, String nationality) {
        // Перевірка чи автор вже існує (за ім'ям та прізвищем)
        Author author = new Author();
        author.setFirstName(firstName);
        author.setLastName(lastName);
        author.setBiography(biography);
        author.setBirthDate(birthDate);
        author.setNationality(nationality);
        return authorRepository.save(author);
    }

    private Book createBook(String isbn, String title, String description,
                           LocalDate publishDate, String publisher, int pageCount,
                           String language, int totalCopies,
                           Set<Author> authors, Set<Category> categories) {
        Book book = new Book();
        book.setIsbn(isbn);
        book.setTitle(title);
        book.setDescription(description);
        book.setPublishDate(publishDate);
        book.setPublisher(publisher);
        book.setPageCount(pageCount);
        book.setLanguage(language);
        book.setTotalCopies(totalCopies);
        book.setAvailableCopies(totalCopies);
        book.setStatus(Book.BookStatus.AVAILABLE);
        book.setAuthors(authors);
        book.setCategories(categories);
        return bookRepository.save(book);
    }

    private User createUser(String username, String email, String firstName, String lastName,
                           User.UserRole role, User.UserStatus status, int maxLoans) {
        // Перевірка чи користувач вже існує
        return userRepository.findByUsername(username).orElseGet(() -> {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"); // "password"
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setRole(role);
            user.setStatus(status);
            user.setMaxLoans(maxLoans);
            return userRepository.save(user);
        });
    }

    private Loan createActiveLoan(User user, Book book, LocalDate startDate, int durationDays) {
        Loan loan = new Loan();
        loan.setUser(user);
        loan.setBook(book);
        loan.setLoanDate(startDate);
        loan.setDueDate(startDate.plusDays(durationDays));
        loan.setStatus(Loan.LoanStatus.ACTIVE);
        loan.setFineAmount(BigDecimal.ZERO);

        // Зменшити доступні копії
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        return loanRepository.save(loan);
    }

    private Loan createReturnedLoan(User user, Book book, LocalDate startDate,
                                   int durationDays, LocalDate returnDate) {
        Loan loan = new Loan();
        loan.setUser(user);
        loan.setBook(book);
        loan.setLoanDate(startDate);
        loan.setDueDate(startDate.plusDays(durationDays));
        loan.setReturnDate(returnDate);
        loan.setStatus(Loan.LoanStatus.RETURNED);
        loan.setFineAmount(BigDecimal.ZERO);
        return loanRepository.save(loan);
    }
}
