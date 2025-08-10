package com.atacadao.guanabara.controller;

import com.atacadao.guanabara.model.ProductPromotion;
import com.atacadao.guanabara.service.ProductPromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/product-promotions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductPromotionController {
    
    private final ProductPromotionService promotionService;
    
    @GetMapping
    public ResponseEntity<List<ProductPromotion>> getAllPromotions() {
        try {
            List<ProductPromotion> promotions = promotionService.getAllPromotions();
            return ResponseEntity.ok(promotions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<ProductPromotion>> getActivePromotions() {
        try {
            List<ProductPromotion> promotions = promotionService.getActivePromotions();
            return ResponseEntity.ok(promotions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductPromotion> getPromotionById(@PathVariable Long id) {
        try {
            return promotionService.getPromotionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<ProductPromotion> createPromotion(@RequestBody ProductPromotion promotion) {
        try {
            System.out.println("Recebendo promoção: " + promotion);
            ProductPromotion createdPromotion = promotionService.createPromotion(promotion);
            System.out.println("Promoção criada com sucesso: " + createdPromotion);
            return ResponseEntity.ok(createdPromotion);
        } catch (Exception e) {
            System.err.println("Erro ao criar promoção: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ProductPromotion> updatePromotion(
            @PathVariable Long id,
            @RequestBody ProductPromotion promotion) {
        try {
            ProductPromotion updatedPromotion = promotionService.updatePromotion(id, promotion);
            return ResponseEntity.ok(updatedPromotion);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePromotion(@PathVariable Long id) {
        try {
            promotionService.deletePromotion(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}/toggle")
    public ResponseEntity<ProductPromotion> togglePromotionStatus(@PathVariable Long id) {
        try {
            ProductPromotion updatedPromotion = promotionService.togglePromotionStatus(id);
            return ResponseEntity.ok(updatedPromotion);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductPromotion>> getPromotionsByProduct(@PathVariable Long productId) {
        try {
            List<ProductPromotion> promotions = promotionService.getPromotionsByProduct(productId);
            return ResponseEntity.ok(promotions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            Long activeCount = promotionService.getActivePromotionsCount();
            Map<String, Object> stats = Map.of(
                "activeCount", activeCount,
                "totalCount", promotionService.getAllPromotions().size()
            );
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
} 