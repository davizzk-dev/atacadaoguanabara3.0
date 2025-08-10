package com.atacadao.guanabara.controller;

import com.atacadao.guanabara.service.MigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/migration")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MigrationController {
    
    private final MigrationService migrationService;
    
    @GetMapping("/preview")
    public ResponseEntity<Map<String, Object>> getMigrationPreview() {
        Map<String, Object> preview = migrationService.getMigrationPreview();
        return ResponseEntity.ok(preview);
    }
    
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startMigration() {
        Map<String, Object> result = migrationService.migrateFromJson();
        
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getMigrationStatus() {
        Map<String, Object> status = Map.of(
            "status", "READY",
            "message", "Sistema pronto para migração",
            "timestamp", java.time.LocalDateTime.now()
        );
        return ResponseEntity.ok(status);
    }
} 