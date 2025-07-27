package com.atacadao.guanabara.service;

import com.atacadao.guanabara.model.User;
import com.atacadao.guanabara.model.Product;
import com.atacadao.guanabara.model.Order;
import com.atacadao.guanabara.model.OrderItem;
import com.atacadao.guanabara.repository.UserRepository;
import com.atacadao.guanabara.repository.ProductRepository;
import com.atacadao.guanabara.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class MigrationService {
    
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public Map<String, Object> migrateFromJson() {
        Map<String, Object> result = new HashMap<>();
        int migratedUsers = 0;
        int migratedProducts = 0;
        int migratedOrders = 0;
        
        try {
            // Migrar usuários
            migratedUsers = migrateUsers();
            
            // Migrar produtos
            migratedProducts = migrateProducts();
            
            // Migrar pedidos
            migratedOrders = migrateOrders();
            
            result.put("success", true);
            result.put("message", "Migração concluída com sucesso!");
            result.put("migratedUsers", migratedUsers);
            result.put("migratedProducts", migratedProducts);
            result.put("migratedOrders", migratedOrders);
            result.put("timestamp", LocalDateTime.now());
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("timestamp", LocalDateTime.now());
        }
        
        return result;
    }
    
    private int migrateUsers() throws IOException {
        File usersFile = new File("../data/users.json");
        if (!usersFile.exists()) {
            return 0;
        }
        
        List<Map<String, Object>> usersData = objectMapper.readValue(
            usersFile, 
            new TypeReference<List<Map<String, Object>>>() {}
        );
        
        int migrated = 0;
        for (Map<String, Object> userData : usersData) {
            try {
                User user = new User();
                user.setEmail((String) userData.get("email"));
                user.setName((String) userData.get("name"));
                user.setPhone((String) userData.get("phone"));
                user.setPassword((String) userData.get("password"));
                
                String role = (String) userData.get("role");
                if ("admin".equals(role)) {
                    user.setRole(User.UserRole.ADMIN);
                } else {
                    user.setRole(User.UserRole.USER);
                }
                
                // Verificar se usuário já existe
                if (!userRepository.existsByEmail(user.getEmail())) {
                    userRepository.save(user);
                    migrated++;
                }
                
            } catch (Exception e) {
                System.err.println("Erro ao migrar usuário: " + userData.get("email") + " - " + e.getMessage());
            }
        }
        
        return migrated;
    }
    
    private int migrateProducts() throws IOException {
        File productsFile = new File("../data/products.json");
        if (!productsFile.exists()) {
            return 0;
        }
        
        List<Map<String, Object>> productsData = objectMapper.readValue(
            productsFile, 
            new TypeReference<List<Map<String, Object>>>() {}
        );
        
        int migrated = 0;
        for (Map<String, Object> productData : productsData) {
            try {
                Product product = new Product();
                product.setName((String) productData.get("name"));
                product.setDescription((String) productData.get("description"));
                product.setPrice(new BigDecimal(productData.get("price").toString()));
                product.setCategory((String) productData.get("category"));
                product.setBrand((String) productData.get("brand"));
                product.setImage((String) productData.get("image"));
                product.setStock((Integer) productData.get("stock"));
                
                // Verificar se produto já existe
                if (!productRepository.findByNameAndBrand(product.getName(), product.getBrand()).isPresent()) {
                    productRepository.save(product);
                    migrated++;
                }
                
            } catch (Exception e) {
                System.err.println("Erro ao migrar produto: " + productData.get("name") + " - " + e.getMessage());
            }
        }
        
        return migrated;
    }
    
    private int migrateOrders() throws IOException {
        File ordersFile = new File("../data/orders.json");
        if (!ordersFile.exists()) {
            return 0;
        }
        
        List<Map<String, Object>> ordersData = objectMapper.readValue(
            ordersFile, 
            new TypeReference<List<Map<String, Object>>>() {}
        );
        
        int migrated = 0;
        for (Map<String, Object> orderData : ordersData) {
            try {
                Order order = new Order();
                order.setUserId((String) orderData.get("userId"));
                order.setUserEmail((String) orderData.get("userEmail"));
                order.setUserName((String) orderData.get("userName"));
                order.setUserPhone((String) orderData.get("userPhone"));
                order.setTotal(new BigDecimal(orderData.get("total").toString()));
                
                // Status do pedido
                String status = (String) orderData.get("status");
                if (status != null) {
                    try {
                        order.setStatus(Order.OrderStatus.valueOf(status.toUpperCase()));
                    } catch (Exception e) {
                        order.setStatus(Order.OrderStatus.PENDING);
                    }
                }
                
                // Itens do pedido
                List<Map<String, Object>> itemsData = (List<Map<String, Object>>) orderData.get("items");
                if (itemsData != null) {
                    for (Map<String, Object> itemData : itemsData) {
                        OrderItem item = new OrderItem();
                        item.setOrder(order);
                        
                        // Buscar o produto pelo ID
                        Long productId = Long.valueOf(itemData.get("productId").toString());
                        Product product = productRepository.findById(productId).orElse(null);
                        if (product != null) {
                            item.setProduct(product);
                        }
                        
                        item.setQuantity((Integer) itemData.get("quantity"));
                        item.setPrice(new BigDecimal(itemData.get("unitPrice").toString()));
                        
                        order.getItems().add(item);
                    }
                }
                
                orderRepository.save(order);
                migrated++;
                
            } catch (Exception e) {
                System.err.println("Erro ao migrar pedido: " + orderData.get("id") + " - " + e.getMessage());
            }
        }
        
        return migrated;
    }
    
    public Map<String, Object> getMigrationPreview() {
        Map<String, Object> preview = new HashMap<>();
        
        try {
            // Contar registros nos arquivos JSON
            File usersFile = new File("../data/users.json");
            File productsFile = new File("../data/products.json");
            File ordersFile = new File("../data/orders.json");
            
            int jsonUsers = 0;
            int jsonProducts = 0;
            int jsonOrders = 0;
            
            if (usersFile.exists()) {
                List<Map<String, Object>> usersData = objectMapper.readValue(
                    usersFile, 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                jsonUsers = usersData.size();
            }
            
            if (productsFile.exists()) {
                List<Map<String, Object>> productsData = objectMapper.readValue(
                    productsFile, 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                jsonProducts = productsData.size();
            }
            
            if (ordersFile.exists()) {
                List<Map<String, Object>> ordersData = objectMapper.readValue(
                    ordersFile, 
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                jsonOrders = ordersData.size();
            }
            
            preview.put("jsonUsers", jsonUsers);
            preview.put("jsonProducts", jsonProducts);
            preview.put("jsonOrders", jsonOrders);
            preview.put("dbUsers", userRepository.count());
            preview.put("dbProducts", productRepository.count());
            preview.put("dbOrders", orderRepository.count());
            preview.put("ready", true);
            
        } catch (Exception e) {
            preview.put("ready", false);
            preview.put("error", e.getMessage());
        }
        
        return preview;
    }
} 