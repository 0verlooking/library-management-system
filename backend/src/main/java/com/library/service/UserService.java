package com.library.service;

import com.library.dto.UserDTO;
import com.library.model.User;

import java.util.List;

/**
 * Інтерфейс для роботи з користувачами (Interface Segregation Principle)
 */
public interface UserService {

    UserDTO createUser(UserDTO userDTO);

    UserDTO getUserById(Long id);

    UserDTO getUserByUsername(String username);

    List<UserDTO> getAllUsers();

    UserDTO updateUser(Long id, UserDTO userDTO);

    void deleteUser(Long id);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
