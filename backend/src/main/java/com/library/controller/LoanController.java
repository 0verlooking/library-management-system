package com.library.controller;

import com.library.dto.LoanDTO;
import com.library.service.LoanService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST контролер для роботи з позиками книг
 */
@RestController
@RequestMapping("/loans")
@CrossOrigin(origins = "*")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @PostMapping
    public ResponseEntity<LoanDTO> createLoan(@RequestParam Long userId, @RequestParam Long bookId) {
        LoanDTO loan = loanService.createLoan(userId, bookId);
        return new ResponseEntity<>(loan, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanDTO> getLoanById(@PathVariable Long id) {
        LoanDTO loan = loanService.getLoanById(id);
        return ResponseEntity.ok(loan);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LoanDTO>> getLoansByUser(@PathVariable Long userId) {
        List<LoanDTO> loans = loanService.getLoansByUserId(userId);
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<LoanDTO>> getLoansByBook(@PathVariable Long bookId) {
        List<LoanDTO> loans = loanService.getLoansByBookId(bookId);
        return ResponseEntity.ok(loans);
    }

    @GetMapping
    public ResponseEntity<List<LoanDTO>> getAllLoans() {
        List<LoanDTO> loans = loanService.getAllLoans();
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<LoanDTO>> getOverdueLoans() {
        List<LoanDTO> loans = loanService.getOverdueLoans();
        return ResponseEntity.ok(loans);
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<LoanDTO> returnBook(@PathVariable Long id) {
        LoanDTO loan = loanService.returnBook(id);
        return ResponseEntity.ok(loan);
    }

    @PutMapping("/{id}/renew")
    public ResponseEntity<LoanDTO> renewLoan(@PathVariable Long id) {
        LoanDTO loan = loanService.renewLoan(id);
        return ResponseEntity.ok(loan);
    }
}
