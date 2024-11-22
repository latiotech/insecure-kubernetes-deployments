package com.example.catapp.controllers;

import com.example.catapp.models.Comment;
import com.example.catapp.repositories.CommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
public class CommentController {

    @Autowired
    private CommentRepository commentRepository;

    @GetMapping("/addComment")
    public String addCommentForm() {
        return "addComment"; // Returns addComment.html
    }

    @PostMapping("/addComment")
    public String addComment(@RequestParam String commentText, Model model) {
        Comment comment = new Comment();
        comment.setText(commentText); // No sanitization
        commentRepository.save(comment);
        model.addAttribute("message", "Comment added");
        return "addCommentResult"; // Returns addCommentResult.html
    }

    @GetMapping("/comments")
    public String getComments(Model model) {
        List<Comment> comments = commentRepository.findAll();
        model.addAttribute("comments", comments);
        return "comments"; // Returns comments.html
    }

        // Vulnerable Endpoint: Delete Comment without CSRF Protection
    @PostMapping("/deleteComment")
    public String deleteComment(@RequestParam int commentId, RedirectAttributes redirectAttributes) {
        commentRepository.deleteById(commentId);
        redirectAttributes.addFlashAttribute("message", "Comment deleted");
        return "redirect:/comments";
    }
}
