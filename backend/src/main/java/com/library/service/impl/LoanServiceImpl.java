package com.library.service.impl;

import com.library.dto.LoanDTO;
import com.library.mapper.LoanMapper;
import com.library.model.Book;
import com.library.model.Loan;
import com.library.model.User;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.UserRepository;
import com.library.service.BookService;
import com.library.service.LoanService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Реалізація LoanService з використанням принципів SOLID
 * Strategy Pattern для розрахунку штрафів
 */
@Service
@Transactional
public class LoanServiceImpl implements LoanService {

    private static final int DEFAULT_LOAN_PERIOD_DAYS = 14;
    private static final BigDecimal FINE_PER_DAY = new BigDecimal("5.00");

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BookService bookService;
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

    @Override
    public LoanDTO createLoan(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        // Перевірка чи користувач може взяти книгу
        long activeLoans = loanRepository.countActiveLoansByUserId(userId);
        if (activeLoans >= user.getMaxLoans()) {
            throw new RuntimeException("User has reached maximum loan limit");
        }

        // Перевірка доступності книги
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
    @Transactional(readOnly = true)
    public LoanDTO getLoanById(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
        return loanMapper.toDTO(loan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanDTO> getLoansByUserId(Long userId) {
        return loanRepository.findByUserId(userId).stream()
                .map(loanMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanDTO> getLoansByBookId(Long bookId) {
        return loanRepository.findByBookId(bookId).stream()
                .map(loanMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanDTO> getAllLoans() {
        return loanRepository.findAll().stream()
                .map(loanMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanDTO> getOverdueLoans() {
        return loanRepository.findOverdueLoans(LocalDate.now()).stream()
                .map(loanMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public LoanDTO returnBook(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (loan.getStatus() != Loan.LoanStatus.ACTIVE) {
            throw new RuntimeException("Loan is not active");
        }

        loan.setReturnDate(LocalDate.now());
        loan.setStatus(Loan.LoanStatus.RETURNED);

        // Розрахунок штрафу
        if (loan.isOverdue()) {
            long daysOverdue = loan.getDaysOverdue();
            BigDecimal fine = FINE_PER_DAY.multiply(new BigDecimal(daysOverdue));
            loan.setFineAmount(fine);
        }

        Loan updatedLoan = loanRepository.save(loan);

        // Оновлення доступності книги
        bookService.updateBookAvailability(loan.getBook().getId(), 1);

        return loanMapper.toDTO(updatedLoan);
    }

    @Override
    public LoanDTO renewLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        if (loan.getStatus() != Loan.LoanStatus.ACTIVE) {
            throw new RuntimeException("Loan is not active");
        }

        if (loan.isOverdue()) {
            throw new RuntimeException("Cannot renew overdue loan");
        }

        loan.setDueDate(loan.getDueDate().plusDays(DEFAULT_LOAN_PERIOD_DAYS));
        Loan updatedLoan = loanRepository.save(loan);

        return loanMapper.toDTO(updatedLoan);
    }

    @Override
    public void updateOverdueLoans() {
        List<Loan> overdueLoans = loanRepository.findOverdueLoans(LocalDate.now());
        for (Loan loan : overdueLoans) {
            if (loan.getStatus() == Loan.LoanStatus.ACTIVE) {
                loan.setStatus(Loan.LoanStatus.OVERDUE);
            }
        }
        loanRepository.saveAll(overdueLoans);
    }
}
