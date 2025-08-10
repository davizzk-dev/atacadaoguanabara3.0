package com.atacadao.guanabara.repository;

import com.atacadao.guanabara.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    List<Product> findByCategory(String category);
    
    List<Product> findByBrand(String brand);
    
    List<Product> findByIsPromotionTrue();
    
    Optional<Product> findByNameAndBrand(String name, String brand);
    
    @Query("SELECT p FROM Product p WHERE p.name LIKE %?1% OR p.brand LIKE %?1%")
    List<Product> searchByNameOrBrand(String searchTerm);
    
    @Query("SELECT DISTINCT p.category FROM Product p")
    List<String> findAllCategories();
    
    @Query("SELECT DISTINCT p.brand FROM Product p")
    List<String> findAllBrands();
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.stock < 10")
    long countLowStockProducts();
} 