package com.library.service;

import com.library.dto.BookDTO;
import com.library.model.Book;

import java.util.List;

/**
 * Інтерфейс для роботи з книгами (Interface Segregation Principle)
 */
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
