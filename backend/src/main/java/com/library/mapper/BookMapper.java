package com.library.mapper;

import com.library.dto.BookDTO;
import com.library.model.Book;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * Mapper для конвертації між Book Entity та BookDTO (Adapter Pattern)
 */
@Component
public class BookMapper {

    private final AuthorMapper authorMapper;
    private final CategoryMapper categoryMapper;

    public BookMapper(AuthorMapper authorMapper, CategoryMapper categoryMapper) {
        this.authorMapper = authorMapper;
        this.categoryMapper = categoryMapper;
    }

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

        if (book.getAuthors() != null) {
            dto.setAuthors(book.getAuthors().stream()
                    .map(authorMapper::toDTO)
                    .collect(Collectors.toSet()));
        }

        if (book.getCategories() != null) {
            dto.setCategories(book.getCategories().stream()
                    .map(categoryMapper::toDTO)
                    .collect(Collectors.toSet()));
        }

        return dto;
    }

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

        if (dto.getAuthors() != null) {
            book.setAuthors(dto.getAuthors().stream()
                    .map(authorMapper::toEntity)
                    .collect(Collectors.toSet()));
        }

        if (dto.getCategories() != null) {
            book.setCategories(dto.getCategories().stream()
                    .map(categoryMapper::toEntity)
                    .collect(Collectors.toSet()));
        }

        return book;
    }
}
