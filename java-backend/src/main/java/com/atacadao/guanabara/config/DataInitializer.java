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
            // Produtos de exemplo
            Product[] products = {
                createProduct("Arroz Integral", "Arroz integral orgânico 1kg", new BigDecimal("8.90"), "Grãos", "Orgânico", "/images/arroz.jpg", 50),
                createProduct("Feijão Preto", "Feijão preto tipo 1 1kg", new BigDecimal("6.50"), "Grãos", "Fazenda", "/images/feijao.jpg", 100),
                createProduct("Óleo de Soja", "Óleo de soja refinado 900ml", new BigDecimal("7.80"), "Óleos", "Liza", "/images/oleo.jpg", 75),
                createProduct("Macarrão Espaguete", "Macarrão espaguete 500g", new BigDecimal("3.90"), "Massas", "Adria", "/images/macarrao.jpg", 120),
                createProduct("Leite Integral", "Leite integral 1L", new BigDecimal("4.50"), "Laticínios", "Itambé", "/images/leite.jpg", 60),
                createProduct("Pão de Forma", "Pão de forma integral 500g", new BigDecimal("5.20"), "Pães", "Pullman", "/images/pao.jpg", 40),
                createProduct("Banana Prata", "Banana prata kg", new BigDecimal("3.90"), "Frutas", "Orgânico", "/images/banana.jpg", 80),
                createProduct("Tomate", "Tomate kg", new BigDecimal("4.80"), "Verduras", "Hidropônico", "/images/tomate.jpg", 90)
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