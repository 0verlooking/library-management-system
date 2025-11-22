package com.library.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO для запиту на реєстрацію
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username обов'язковий")
    @Size(min = 3, max = 50, message = "Username має бути від 3 до 50 символів")
    private String username;

    @NotBlank(message = "Email обов'язковий")
    @Email(message = "Email має бути валідним")
    private String email;

    @NotBlank(message = "Password обов'язковий")
    @Size(min = 6, message = "Password має бути мінімум 6 символів")
    private String password;

    @NotBlank(message = "Ім'я обов'язкове")
    private String firstName;

    @NotBlank(message = "Прізвище обов'язкове")
    private String lastName;
}
