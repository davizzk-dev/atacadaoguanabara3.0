package com.atacadao.guanabara.controller;

import com.atacadao.guanabara.model.User;
import com.atacadao.guanabara.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {
    
    private final UserService userService;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");
        
        // Verificar se é admin
        User admin = userService.authenticateAdmin(email, password);
        if (admin != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("id", admin.getId());
            response.put("name", admin.getName());
            response.put("email", admin.getEmail());
            response.put("role", admin.getRole());
            return ResponseEntity.ok(response);
        }
        
        // Verificar usuário normal
        if (userService.authenticateUser(email, password)) {
            User user = userService.getUserByEmail(email).orElse(null);
            if (user != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("id", user.getId());
                response.put("name", user.getName());
                response.put("email", user.getEmail());
                response.put("phone", user.getPhone());
                response.put("role", user.getRole());
                return ResponseEntity.ok(response);
            }
        }
        
        return ResponseEntity.status(401).body(Map.of("error", "Email ou senha incorretos"));
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User createdUser = userService.createUser(user);
            Map<String, Object> response = new HashMap<>();
            response.put("id", createdUser.getId());
            response.put("name", createdUser.getName());
            response.put("email", createdUser.getEmail());
            response.put("phone", createdUser.getPhone());
            response.put("role", createdUser.getRole());
            return ResponseEntity.status(201).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        
        // Simular envio de email
        System.out.println("📧 Email simulado enviado para: " + email);
        System.out.println("🔐 Código de verificação: 123456");
        
        return ResponseEntity.ok(Map.of(
            "message", "Código de verificação enviado com sucesso",
            "email", email
        ));
    }
    
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        
        // Simular verificação
        if ("123456".equals(code)) {
            return ResponseEntity.ok(Map.of(
                "message", "Código verificado com sucesso",
                "email", email
            ));
        }
        
        return ResponseEntity.badRequest().body(Map.of("error", "Código inválido"));
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");
        
        // Simular reset de senha
        if ("123456".equals(code) && newPassword != null && newPassword.length() >= 6) {
            System.out.println("✅ Senha alterada para: " + email);
            return ResponseEntity.ok(Map.of("message", "Senha alterada com sucesso"));
        }
        
        return ResponseEntity.badRequest().body(Map.of("error", "Dados inválidos"));
    }
} 