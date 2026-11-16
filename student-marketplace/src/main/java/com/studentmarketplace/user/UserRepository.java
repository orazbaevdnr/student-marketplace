package com.studentmarketplace.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUniversityEmail(String universityEmail);

    boolean existsByUniversityEmail(String universityEmail);
}
