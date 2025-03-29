package com.example.catapp.config;

import com.example.catapp.models.CatPicture;
import com.example.catapp.models.Comment;
import com.example.catapp.models.User;
import com.example.catapp.repositories.CatPictureRepository;
import com.example.catapp.repositories.CommentRepository;
import com.example.catapp.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CatPictureRepository catPictureRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Override
    public void run(String... args) {
        // Create dummy users
        List<User> users = Arrays.asList(
            createUser("admin", "admin123"),
            createUser("john_doe", "password123"),
            createUser("jane_smith", "qwerty123"),
            createUser("bob_wilson", "letmein123")
        );
        users.forEach(userRepository::save);

        // Create dummy cat pictures
        List<CatPicture> pictures = Arrays.asList(
            createCatPicture("Fluffy", "https://placekitten.com/200/200", 1),
            createCatPicture("Whiskers", "https://placekitten.com/201/201", 2),
            createCatPicture("Mittens", "https://placekitten.com/202/202", 3),
            createCatPicture("Shadow", "https://placekitten.com/203/203", 4),
            createCatPicture("Luna", "https://placekitten.com/204/204", 1)
        );
        pictures.forEach(catPictureRepository::save);

        // Create dummy comments
        List<Comment> comments = Arrays.asList(
            createComment("What a beautiful cat! 😺", 1),
            createComment("I love the colors!", 2),
            createComment("This cat looks so happy!", 3),
            createComment("Great photo! 📸", 4),
            createComment("Adorable! ❤️", 1)
        );
        comments.forEach(commentRepository::save);
    }

    private User createUser(String username, String password) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(password); // In a real app, this should be hashed
        return user;
    }

    private CatPicture createCatPicture(String name, String url, int ownerId) {
        CatPicture picture = new CatPicture();
        picture.setName(name);
        picture.setUrl(url);
        picture.setOwnerId(ownerId);
        return picture;
    }

    private Comment createComment(String text, int userId) {
        Comment comment = new Comment();
        comment.setText(text);
        return comment;
    }
} 