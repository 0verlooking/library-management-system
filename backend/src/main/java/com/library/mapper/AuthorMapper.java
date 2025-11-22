package com.library.mapper;

import com.library.dto.AuthorDTO;
import com.library.model.Author;
import org.springframework.stereotype.Component;

/**
 * Mapper для конвертації між Author Entity та AuthorDTO (Adapter Pattern)
 */
@Component
public class AuthorMapper {

    public AuthorDTO toDTO(Author author) {
        if (author == null) {
            return null;
        }

        AuthorDTO dto = new AuthorDTO();
        dto.setId(author.getId());
        dto.setFirstName(author.getFirstName());
        dto.setLastName(author.getLastName());
        dto.setBiography(author.getBiography());
        dto.setBirthDate(author.getBirthDate());
        dto.setNationality(author.getNationality());

        return dto;
    }

    public Author toEntity(AuthorDTO dto) {
        if (dto == null) {
            return null;
        }

        Author author = new Author();
        author.setId(dto.getId());
        author.setFirstName(dto.getFirstName());
        author.setLastName(dto.getLastName());
        author.setBiography(dto.getBiography());
        author.setBirthDate(dto.getBirthDate());
        author.setNationality(dto.getNationality());

        return author;
    }
}
