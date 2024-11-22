package com.example.catapp.controllers;

import com.example.catapp.models.User;
import com.example.catapp.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
    
@Controller
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/register")
    public String registerForm() {
        return "register"; // Returns register.html
    }

    @PostMapping("/register")
    public String register(@RequestParam String username, @RequestParam String password, Model model) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(password); // Password stored in plaintext
        userRepository.save(user);
        model.addAttribute("message", "User registered");
        return "registerResult"; // Returns registerResult.html
    }

    @GetMapping("/login")
    public String loginForm() {
        return "login"; // Returns login.html
    }

    @PostMapping("/login")
    public String login(@RequestParam String username, @RequestParam String password, Model model) {
        User user = userRepository.findByUsernameAndPassword(username, password);
        if (user != null) {
            model.addAttribute("message", "Login successful");
        } else {
            model.addAttribute("message", "Invalid credentials");
        }
        return "loginResult"; // Returns loginResult.html
    }

        // Vulnerable IDOR Endpoint: View Profile
    @GetMapping("/profile")
    public String viewProfile(@RequestParam int userId, Model model) {
        // No authorization check; any user can view any profile
        User user = userRepository.findById(userId).orElse(null);
        model.addAttribute("user", user);
        return "profile"; // Returns profile.html
    }

    // Vulnerable IDOR Endpoint: Edit Profile
    @GetMapping("/editProfile")
    public String editProfileForm(@RequestParam int userId, Model model) {
        // No authorization check
        User user = userRepository.findById(userId).orElse(null);
        model.addAttribute("user", user);
        return "editProfile"; // Returns editProfile.html
    }

    @PostMapping("/editProfile")
    public String editProfile(@RequestParam int userId, @RequestParam String username,
                              @RequestParam String password, RedirectAttributes redirectAttributes) {
        // No authorization check
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            user.setUsername(username);
            user.setPassword(password); // Still storing plaintext passwords
            userRepository.save(user);
            redirectAttributes.addFlashAttribute("message", "Profile updated");
        } else {
            redirectAttributes.addFlashAttribute("message", "User not found");
        }
        return "redirect:/profile?userId=" + userId;
    }
}
}
