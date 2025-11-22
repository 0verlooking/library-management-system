package com.library.service;

import com.library.dto.LoanDTO;

import java.util.List;

/**
 * Інтерфейс для роботи з позиками книг (Interface Segregation Principle)
 */
public interface LoanService {

    LoanDTO createLoan(Long userId, Long bookId);

    LoanDTO getLoanById(Long id);

    List<LoanDTO> getLoansByUserId(Long userId);

    List<LoanDTO> getLoansByBookId(Long bookId);

    List<LoanDTO> getAllLoans();

    List<LoanDTO> getOverdueLoans();

    LoanDTO returnBook(Long loanId);

    LoanDTO renewLoan(Long loanId);

    void updateOverdueLoans();
}
