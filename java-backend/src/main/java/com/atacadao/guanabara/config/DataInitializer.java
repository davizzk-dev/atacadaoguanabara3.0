package com.atacadao.guanabara.config;

import com.atacadao.guanabara.model.Product;
import com.atacadao.guanabara.model.User;
import com.atacadao.guanabara.repository.ProductRepository;
import com.atacadao.guanabara.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    
    @Override
    public void run(String... args) throws Exception {
        System.out.println("🌱 Inicializando dados do banco...");
        
        // Criar usuários de exemplo
        createUsers();
        
        // Criar produtos de exemplo
        createProducts();
        
        System.out.println("✅ Dados inicializados com sucesso!");
    }
    
    private void createUsers() {
        if (userRepository.count() == 0) {
            // Admin
            User admin = new User();
            admin.setEmail("admin");
            admin.setName("Administrador");
            admin.setPhone("85985147067");
            admin.setPassword("atacadaoguanabaraadmin123secreto");
            admin.setRole(User.UserRole.ADMIN);
            userRepository.save(admin);
            
            // Usuário de teste
            User user = new User();
            user.setEmail("teste@atacadao.com");
            user.setName("Usuário Teste");
            user.setPhone("85988286178");
            user.setPassword(hashPassword("123456"));
            user.setRole(User.UserRole.USER);
            userRepository.save(user);
            
            System.out.println("👥 Usuários criados: Admin e Usuário Teste");
        }
    }
    
    private void createProducts() {
        if (productRepository.count() == 0) {
            // Produtos de exemplo - usando os mesmos do frontend
            Product[] products = {
                createProduct("ÁGUA MINERAL NATURAGUA 1,5L", "Água mineral natural 1,5 litros", new BigDecimal("2.99"), "Bebidas", "Naturagua", "https://i.ibb.co/N65dsgfh/aguanaturagua1-5l.jpg", 6),
                createProduct("ÁGUA MINERAL NATURAGUA 500ML C/ GÁS", "Água mineral com C/GÁS 500ml", new BigDecimal("1.99"), "Bebidas", "Naturagua", "https://i.ibb.co/p6WM3mnK/aguacomg-s.jpg", 12),
                createProduct("ÁGUA MINERAL NATURAGUA 500ML S/ GÁS", "Água mineral sem gás 500ml", new BigDecimal("1.49"), "Bebidas", "Naturagua", "https://i.ibb.co/4gVp5kbz/aguasemg-s.jpg", 12),
                createProduct("AMENDOIM EM BANDA CASTRO 1KG", "Amendoim em banda tradicional 1kg", new BigDecimal("13.99"), "Snacks", "Castro", "https://i.ibb.co/PZ9HLZrg/amendoimembanda.jpg", 4),
                createProduct("ARROZ BRANCO NAMORADO 1KG", "Arroz branco tipo 1 1kg", new BigDecimal("5.69"), "Grãos", "Namorado", "https://i.ibb.co/V0rGtJcP/arroznamorado.jpg", 10),
                createProduct("ARROZ BRANCO PAI JOÃO 1KG", "Arroz branco tipo 1 1kg", new BigDecimal("5.49"), "Grãos", "Pai João", "https://i.ibb.co/gbzsG1wc/arrozbrancopaijo-o.jpg", 10)
            };
            
            for (Product product : products) {
                productRepository.save(product);
            }
            
            System.out.println("📦 " + products.length + " produtos criados");
        }
    }
    
    private Product createProduct(String name, String description, BigDecimal price, 
                                String category, String brand, String image, Integer stock) {
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setCategory(category);
        product.setBrand(brand);
        product.setImage(image);
        product.setStock(stock);
        product.setIsPromotion(false);
        return product;
    }
    
    private String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erro ao criptografar senha", e);
        }
    }
} 