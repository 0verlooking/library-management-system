package com.library.dto;

import com.library.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private User.UserRole role;
    private User.UserStatus status;
    private Integer maxLoans;
    private LocalDateTime createdAt;
}
