package com.example.catapp.config;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Vulnerability 4: Security Misconfiguration
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ResponseBody
    public String handleAllExceptions(Exception ex) {
        // Detailed error messages are exposed to users
        return "Error occurred: " + ex.getMessage();
    }
}
