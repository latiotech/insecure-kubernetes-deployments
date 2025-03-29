package com.example.catapp.repositories;

import com.example.catapp.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    User findByUsernameAndPassword(String username, String password); // Vulnerability: Insecure authentication
    User findByUsername(String username); // Vulnerability: No rate limiting on username checks
}
