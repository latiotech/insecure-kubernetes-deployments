package com.example.catapp.repositories;

import com.example.catapp.models.CatPicture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CatPictureRepository extends JpaRepository<CatPicture, Integer> {

    // Vulnerable method using a raw query with user input
    @Query(value = "?1", nativeQuery = true)
    List<CatPicture> findByNameQuery(String query);
}
