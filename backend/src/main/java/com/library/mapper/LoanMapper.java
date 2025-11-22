package com.library.mapper;

import com.library.dto.LoanDTO;
import com.library.model.Loan;
import org.springframework.stereotype.Component;

/**
 * Mapper для конвертації між Loan Entity та LoanDTO (Adapter Pattern)
 */
@Component
public class LoanMapper {

    public LoanDTO toDTO(Loan loan) {
        if (loan == null) {
            return null;
        }

        LoanDTO dto = new LoanDTO();
        dto.setId(loan.getId());
        dto.setUserId(loan.getUser().getId());
        dto.setUsername(loan.getUser().getUsername());
        dto.setBookId(loan.getBook().getId());
        dto.setBookTitle(loan.getBook().getTitle());
        dto.setLoanDate(loan.getLoanDate());
        dto.setDueDate(loan.getDueDate());
        dto.setReturnDate(loan.getReturnDate());
        dto.setStatus(loan.getStatus());
        dto.setFineAmount(loan.getFineAmount());
        dto.setNotes(loan.getNotes());

        return dto;
    }
}
