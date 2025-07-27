package com.atacadao.guanabara.controller;

import com.atacadao.guanabara.model.Order;
import com.atacadao.guanabara.model.OrderItem;
import com.atacadao.guanabara.model.Product;
import com.atacadao.guanabara.model.User;
import com.atacadao.guanabara.repository.OrderRepository;
import com.atacadao.guanabara.repository.ProductRepository;
import com.atacadao.guanabara.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.RuntimeMXBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import jakarta.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {
    
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        try {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Estatísticas básicas
        dashboard.put("totalUsers", userRepository.count());
        dashboard.put("totalProducts", productRepository.count());
        dashboard.put("totalOrders", orderRepository.count());
            
            // Receita total (simulada)
            double totalRevenue = 15000.0;
            dashboard.put("totalRevenue", totalRevenue);
            
            // Dados para gráficos
            List<Map<String, Object>> monthlyRevenue = Arrays.asList(
                Map.of("month", "Jan", "revenue", 12000.0, "orders", 45),
                Map.of("month", "Fev", "revenue", 13500.0, "orders", 52),
                Map.of("month", "Mar", "revenue", 14200.0, "orders", 58),
                Map.of("month", "Abr", "revenue", 13800.0, "orders", 55),
                Map.of("month", "Mai", "revenue", 15600.0, "orders", 62),
                Map.of("month", "Jun", "revenue", 16200.0, "orders", 68)
            );
            dashboard.put("monthlyRevenue", monthlyRevenue);
            
            // Categorias de produtos
            List<Map<String, Object>> productCategories = Arrays.asList(
                Map.of("name", "Grãos", "value", 25),
                Map.of("name", "Óleos", "value", 15),
                Map.of("name", "Massas", "value", 20),
                Map.of("name", "Laticínios", "value", 18),
                Map.of("name", "Frutas", "value", 22)
            );
            dashboard.put("productCategories", productCategories);
            
            // Status dos pedidos
            List<Map<String, Object>> orderStatus = Arrays.asList(
                Map.of("name", "Pendente", "value", 12),
                Map.of("name", "Processando", "value", 8),
                Map.of("name", "Entregue", "value", 45),
                Map.of("name", "Cancelado", "value", 3)
            );
            dashboard.put("orderStatus", orderStatus);
        
        return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao buscar dados do dashboard: " + e.getMessage()));
        }
    }
    
    @GetMapping("/system-status")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        try {
        Map<String, Object> status = new HashMap<>();
        status.put("uptime", getUptime());
        status.put("memory", getMemoryInfo());
        status.put("system", getSystemInfo());
        status.put("database", getDatabaseStatus());
            status.put("timestamp", new Date());
        return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao buscar status do sistema: " + e.getMessage()));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("timestamp", new Date());
            health.put("version", "1.0.0");
            health.put("database", "H2");
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro no health check: " + e.getMessage()));
        }
    }
    
    @GetMapping("/database-info")
    public ResponseEntity<Map<String, Object>> getDatabaseInfo() {
        try {
        Map<String, Object> dbInfo = new HashMap<>();
        dbInfo.put("type", "H2 Database");
        dbInfo.put("url", "jdbc:h2:file:./data/guanabara_db");
            dbInfo.put("users", userRepository.count());
            dbInfo.put("products", productRepository.count());
            dbInfo.put("orders", orderRepository.count());
        return ResponseEntity.ok(dbInfo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao buscar informações do banco: " + e.getMessage()));
        }
    }
    
    @GetMapping("/migration-status")
    public ResponseEntity<Map<String, Object>> getMigrationStatus() {
        try {
        Map<String, Object> migration = new HashMap<>();
            migration.put("status", "completed");
            migration.put("lastMigration", new Date());
            migration.put("migratedUsers", userRepository.count());
            migration.put("migratedProducts", productRepository.count());
            migration.put("migratedOrders", orderRepository.count());
            return ResponseEntity.ok(migration);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao buscar status da migração: " + e.getMessage()));
        }
    }

    @GetMapping("/report/monthly")
    public ResponseEntity<byte[]> generateMonthlyReport(HttpServletResponse response) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            // Cabeçalho
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("Relatório Mensal - Atacadão Guanabara", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));
            
            // Informações do mês
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            document.add(new Paragraph("Período: " + new Date(), headerFont));
            document.add(new Paragraph(" "));
            
            // Estatísticas
            document.add(new Paragraph("Estatísticas:", headerFont));
            document.add(new Paragraph("Total de Usuários: " + userRepository.count()));
            document.add(new Paragraph("Total de Produtos: " + productRepository.count()));
            document.add(new Paragraph("Total de Pedidos: " + orderRepository.count()));
            document.add(new Paragraph(" "));
            
            // Tabela de produtos
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            
            // Cabeçalho da tabela
            table.addCell(new PdfPCell(new Phrase("Produto", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Categoria", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Preço", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Estoque", headerFont)));
            
            // Dados dos produtos
            productRepository.findAll().forEach(product -> {
                table.addCell(product.getName());
                table.addCell(product.getCategory());
                table.addCell("R$ " + product.getPrice());
                table.addCell(String.valueOf(product.getStock()));
            });
            
            document.add(table);
            document.close();
            
            byte[] pdfBytes = baos.toByteArray();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "relatorio-mensal.pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/report/complete")
    public ResponseEntity<byte[]> generateCompleteReport(HttpServletResponse response) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            // Cabeçalho
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            
            Paragraph title = new Paragraph("RELATÓRIO COMPLETO - ATACADÃO GUANABARA", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));
            
            // Informações gerais
            document.add(new Paragraph("Data do Relatório: " + new Date(), normalFont));
            document.add(new Paragraph(" "));
            
            // Estatísticas gerais
            document.add(new Paragraph("ESTATÍSTICAS GERAIS", headerFont));
            document.add(new Paragraph("Total de Usuários: " + userRepository.count(), normalFont));
            document.add(new Paragraph("Total de Produtos: " + productRepository.count(), normalFont));
            document.add(new Paragraph("Total de Pedidos: " + orderRepository.count(), normalFont));
            document.add(new Paragraph(" "));
            
            // Lista de produtos
            document.add(new Paragraph("PRODUTOS CADASTRADOS", headerFont));
            PdfPTable productTable = new PdfPTable(4);
            productTable.setWidthPercentage(100);
            
            productTable.addCell(new PdfPCell(new Phrase("Nome", headerFont)));
            productTable.addCell(new PdfPCell(new Phrase("Categoria", headerFont)));
            productTable.addCell(new PdfPCell(new Phrase("Preço", headerFont)));
            productTable.addCell(new PdfPCell(new Phrase("Estoque", headerFont)));
            
            productRepository.findAll().forEach(product -> {
                productTable.addCell(product.getName());
                productTable.addCell(product.getCategory());
                productTable.addCell("R$ " + product.getPrice());
                productTable.addCell(String.valueOf(product.getStock()));
            });
            
            document.add(productTable);
            document.add(new Paragraph(" "));
            
            // Lista de usuários
            document.add(new Paragraph("USUÁRIOS CADASTRADOS", headerFont));
            PdfPTable userTable = new PdfPTable(3);
            userTable.setWidthPercentage(100);
            
            userTable.addCell(new PdfPCell(new Phrase("Nome", headerFont)));
            userTable.addCell(new PdfPCell(new Phrase("Email", headerFont)));
            userTable.addCell(new PdfPCell(new Phrase("Telefone", headerFont)));
            
            userRepository.findAll().forEach(user -> {
                userTable.addCell(user.getName());
                userTable.addCell(user.getEmail());
                userTable.addCell(user.getPhone());
            });
            
            document.add(userTable);
            document.add(new Paragraph(" "));
            
            // Rodapé
            Paragraph footer = new Paragraph("Relatório gerado automaticamente pelo sistema Atacadão Guanabara", normalFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);
            
            document.close();
            
            byte[] pdfBytes = baos.toByteArray();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "relatorio-completo.pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/report/products")
    public ResponseEntity<byte[]> generateProductsReport(HttpServletResponse response) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            
            Paragraph title = new Paragraph("RELATÓRIO DE PRODUTOS", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));
            
            // Estatísticas de produtos
            long totalProducts = productRepository.count();
            long lowStockProducts = productRepository.findAll().stream()
                .filter(p -> p.getStock() < 10)
                .count();
            
            document.add(new Paragraph("Total de Produtos: " + totalProducts, normalFont));
            document.add(new Paragraph("Produtos com Estoque Baixo: " + lowStockProducts, normalFont));
            document.add(new Paragraph(" "));
            
            // Tabela de produtos
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            
            table.addCell(new PdfPCell(new Phrase("Nome", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Categoria", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Preço", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Estoque", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Marca", headerFont)));
            
            productRepository.findAll().forEach(product -> {
                table.addCell(new PdfPCell(new Phrase(product.getName(), normalFont)));
                table.addCell(new PdfPCell(new Phrase(product.getCategory(), normalFont)));
                table.addCell(new PdfPCell(new Phrase("R$ " + product.getPrice(), normalFont)));
                table.addCell(new PdfPCell(new Phrase(String.valueOf(product.getStock()), normalFont)));
                table.addCell(new PdfPCell(new Phrase(product.getBrand(), normalFont)));
            });
            
            document.add(table);
            document.close();
            
            byte[] pdfBytes = baos.toByteArray();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "relatorio-produtos.pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/report/orders")
    public ResponseEntity<byte[]> generateOrdersReport(HttpServletResponse response) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            
            Paragraph title = new Paragraph("RELATÓRIO DE PEDIDOS", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));
            
            // Estatísticas de pedidos
            long totalOrders = orderRepository.count();
            document.add(new Paragraph("Total de Pedidos: " + totalOrders, normalFont));
            document.add(new Paragraph(" "));
            
            // Tabela de pedidos (simulada)
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            
            table.addCell(new PdfPCell(new Phrase("ID", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Cliente", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Status", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Total", headerFont)));
            
            // Dados simulados
            String[] statuses = {"PENDENTE", "PROCESSANDO", "ENTREGUE", "CANCELADO"};
            String[] customers = {"João Silva", "Maria Santos", "Pedro Costa", "Ana Paula"};
            
            for (int i = 1; i <= 10; i++) {
                table.addCell(new PdfPCell(new Phrase("PED" + String.format("%03d", i), normalFont)));
                table.addCell(new PdfPCell(new Phrase(customers[i % customers.length], normalFont)));
                table.addCell(new PdfPCell(new Phrase(statuses[i % statuses.length], normalFont)));
                table.addCell(new PdfPCell(new Phrase("R$ " + (Math.random() * 200 + 50), normalFont)));
            }
            
            document.add(table);
            document.close();
            
            byte[] pdfBytes = baos.toByteArray();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "relatorio-pedidos.pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/report/analytics")
    public ResponseEntity<byte[]> generateAnalyticsReport(HttpServletResponse response) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            
            Paragraph title = new Paragraph("RELATÓRIO DE ANALYTICS", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));
            
            // Métricas de performance
            document.add(new Paragraph("MÉTRICAS DE PERFORMANCE", headerFont));
            document.add(new Paragraph("Receita do Mês Atual: R$ 15.000,00", normalFont));
            document.add(new Paragraph("Receita do Mês Anterior: R$ 13.500,00", normalFont));
            document.add(new Paragraph("Crescimento: +11.1%", normalFont));
            document.add(new Paragraph("Pedidos do Mês: 68", normalFont));
            document.add(new Paragraph("Ticket Médio: R$ 220,59", normalFont));
            document.add(new Paragraph(" "));
            
            // Produtos mais vendidos
            document.add(new Paragraph("PRODUTOS MAIS VENDIDOS", headerFont));
            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            
            table.addCell(new PdfPCell(new Phrase("Produto", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Categoria", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Quantidade", headerFont)));
            
            String[] products = {"Arroz Integral", "Feijão Preto", "Óleo de Soja", "Macarrão Espaguete", "Leite Integral"};
            String[] categories = {"Grãos", "Grãos", "Óleos", "Massas", "Laticínios"};
            
            for (int i = 0; i < products.length; i++) {
                table.addCell(new PdfPCell(new Phrase(products[i], normalFont)));
                table.addCell(new PdfPCell(new Phrase(categories[i], normalFont)));
                table.addCell(new PdfPCell(new Phrase(String.valueOf((int)(Math.random() * 100 + 50)), normalFont)));
            }
            
            document.add(table);
            document.close();
            
            byte[] pdfBytes = baos.toByteArray();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "relatorio-analytics.pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/analytics/sales-trends")
    public ResponseEntity<Map<String, Object>> getSalesTrends(
            @RequestParam(defaultValue = "30") int days) {
        try {
            Map<String, Object> trends = new HashMap<>();
            trends.put("totalSales", 15000.0);
            trends.put("totalOrders", 68);
            trends.put("averageOrderValue", 220.59);
            
            // Dados diários simulados
            List<Map<String, Object>> dailyData = new ArrayList<>();
            for (int i = 0; i < days; i++) {
                Map<String, Object> dayData = new HashMap<>();
                dayData.put("date", "2024-01-" + String.format("%02d", i + 1));
                dayData.put("sales", Math.random() * 500 + 200);
                dayData.put("orders", (int)(Math.random() * 10 + 5));
                dailyData.add(dayData);
            }
            trends.put("dailyData", dailyData);
            
            return ResponseEntity.ok(trends);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao buscar tendências de vendas: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/top-products")
    public ResponseEntity<List<Map<String, Object>>> getTopProducts(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<Map<String, Object>> topProducts = new ArrayList<>();
            
            String[] productNames = {"Arroz Integral", "Feijão Preto", "Óleo de Soja", "Macarrão Espaguete", "Leite Integral"};
            String[] categories = {"Grãos", "Grãos", "Óleos", "Massas", "Laticínios"};
            
            for (int i = 0; i < Math.min(limit, productNames.length); i++) {
                Map<String, Object> productData = new HashMap<>();
                productData.put("id", i + 1);
                productData.put("name", productNames[i]);
                productData.put("quantity", (int)(Math.random() * 100 + 50));
                productData.put("category", categories[i]);
                productData.put("revenue", Math.random() * 1000 + 500);
                topProducts.add(productData);
            }
            
            return ResponseEntity.ok(topProducts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(List.of(Map.of("error", "Erro ao buscar produtos mais vendidos: " + e.getMessage())));
        }
    }

    @GetMapping("/analytics/performance")
    public ResponseEntity<Map<String, Object>> getPerformanceMetrics() {
        try {
            Map<String, Object> performance = new HashMap<>();
            performance.put("currentMonthRevenue", 15000.0);
            performance.put("lastMonthRevenue", 13500.0);
            performance.put("revenueGrowth", 11.1);
            performance.put("currentMonthOrders", 68);
            performance.put("lastMonthOrders", 62);
            performance.put("averageOrderValue", 220.59);
            performance.put("customerSatisfaction", 4.5);
            performance.put("returnRate", 2.3);
            
            return ResponseEntity.ok(performance);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao buscar métricas de performance: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/quotation")
    public ResponseEntity<Map<String, Object>> getQuotationData() {
        try {
            Map<String, Object> quotation = new HashMap<>();
            
            // Dados de cotação simulados
            List<Map<String, Object>> productQuotations = new ArrayList<>();
            String[] products = {"Arroz", "Feijão", "Óleo", "Macarrão", "Leite", "Açúcar", "Café", "Farinha"};
            
            for (int i = 0; i < products.length; i++) {
                Map<String, Object> productQuote = new HashMap<>();
                productQuote.put("product", products[i]);
                productQuote.put("currentPrice", Math.random() * 10 + 5);
                productQuote.put("previousPrice", Math.random() * 10 + 5);
                productQuote.put("change", (Math.random() - 0.5) * 2);
                productQuote.put("trend", Math.random() > 0.5 ? "up" : "down");
                productQuote.put("supplier", "Fornecedor " + (i + 1));
                productQuotations.add(productQuote);
            }
            
            quotation.put("products", productQuotations);
            quotation.put("lastUpdate", LocalDateTime.now().toString());
            quotation.put("totalProducts", productQuotations.size());
            
            return ResponseEntity.ok(quotation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao buscar dados de cotação: " + e.getMessage()));
        }
    }
    
    private Map<String, Object> getUptime() {
        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
        long uptime = runtimeBean.getUptime();
        long uptimeInSeconds = uptime / 1000;
        long hours = uptimeInSeconds / 3600;
        long minutes = (uptimeInSeconds % 3600) / 60;
        long seconds = uptimeInSeconds % 60;
        
        Map<String, Object> uptimeInfo = new HashMap<>();
        uptimeInfo.put("milliseconds", uptime);
        uptimeInfo.put("formatted", String.format("%02d:%02d:%02d", hours, minutes, seconds));
        return uptimeInfo;
    }
    
    private Map<String, Object> getMemoryInfo() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
        long maxMemory = memoryBean.getHeapMemoryUsage().getMax();
        
        Map<String, Object> memoryInfo = new HashMap<>();
        memoryInfo.put("used", usedMemory);
        memoryInfo.put("max", maxMemory);
        memoryInfo.put("percentage", (double) usedMemory / maxMemory * 100);
        return memoryInfo;
    }
    
    private Map<String, Object> getSystemInfo() {
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        
        Map<String, Object> systemInfo = new HashMap<>();
        systemInfo.put("os", osBean.getName());
        systemInfo.put("version", osBean.getVersion());
        systemInfo.put("arch", osBean.getArch());
        systemInfo.put("processors", osBean.getAvailableProcessors());
        systemInfo.put("loadAverage", osBean.getSystemLoadAverage());
        return systemInfo;
    }
    
    private Map<String, Object> getDatabaseStatus() {
        Map<String, Object> dbStatus = new HashMap<>();
        dbStatus.put("status", "connected");
        dbStatus.put("type", "H2");
        dbStatus.put("url", "jdbc:h2:file:./data/guanabara_db");
        return dbStatus;
    }
} 