package com.atacadao.guanabara.repository;

import com.atacadao.guanabara.model.ProductPromotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface ProductPromotionRepository extends JpaRepository<ProductPromotion, Long> {
    
    List<ProductPromotion> findByIsActive(Boolean isActive);
    
    @Query("SELECT p FROM ProductPromotion p WHERE p.isActive = true AND (p.validUntil IS NULL OR p.validUntil > :now)")
    List<ProductPromotion> findActivePromotions(LocalDateTime now);
    
    @Query("SELECT p FROM ProductPromotion p WHERE p.product.id = :productId AND p.isActive = true")
    List<ProductPromotion> findByProductIdAndActive(Long productId);
    
    @Query("SELECT COUNT(p) FROM ProductPromotion p WHERE p.isActive = true")
    Long countActivePromotions();
    
    @Query("SELECT p FROM ProductPromotion p ORDER BY p.createdAt DESC")
    List<ProductPromotion> findAllOrderByCreatedAtDesc();
} 