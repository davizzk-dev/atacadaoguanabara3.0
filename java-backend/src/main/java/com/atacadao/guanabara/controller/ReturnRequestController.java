package com.atacadao.guanabara.controller;

import com.atacadao.guanabara.model.ReturnRequest;
import com.atacadao.guanabara.service.ReturnRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/returns")
@CrossOrigin(origins = "http://localhost:3005")
public class ReturnRequestController {
    
    @Autowired
    private ReturnRequestService returnRequestService;
    
    // Criar nova solicitação
    @PostMapping
    public ResponseEntity<?> createReturnRequest(
            @RequestParam("orderId") String orderId,
            @RequestParam("userName") String userName,
            @RequestParam("userEmail") String userEmail,
            @RequestParam("userPhone") String userPhone,
            @RequestParam("productName") String productName,
            @RequestParam(value = "productId", required = false) String productId,
            @RequestParam("quantity") Integer quantity,
            @RequestParam("requestType") String requestType,
            @RequestParam("reason") String reason,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos) {
        
        try {
            // Converter string para enum
            ReturnRequest.RequestType type = ReturnRequest.RequestType.valueOf(requestType.toUpperCase());
            
            // Criar objeto ReturnRequest
            ReturnRequest returnRequest = new ReturnRequest(
                orderId, userName, userEmail, userPhone, 
                productName, productId, quantity, type, reason, description
            );
            
            // Salvar solicitação
            ReturnRequest savedRequest = returnRequestService.createReturnRequest(returnRequest, photos);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Solicitação enviada com sucesso!",
                "requestId", savedRequest.getId()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erro ao enviar solicitação: " + e.getMessage()
            ));
        }
    }
    
    // Buscar todas as solicitações (admin)
    @GetMapping
    public ResponseEntity<List<ReturnRequest>> getAllReturnRequests() {
        try {
            List<ReturnRequest> requests = returnRequestService.getAllReturnRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Buscar solicitação por ID
    @GetMapping("/{id}")
    public ResponseEntity<ReturnRequest> getReturnRequestById(@PathVariable Long id) {
        try {
            ReturnRequest request = returnRequestService.getReturnRequestById(id);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Buscar solicitações pendentes
    @GetMapping("/pending")
    public ResponseEntity<List<ReturnRequest>> getPendingRequests() {
        try {
            List<ReturnRequest> requests = returnRequestService.getPendingRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Buscar por status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ReturnRequest>> getRequestsByStatus(@PathVariable String status) {
        try {
            ReturnRequest.ReturnStatus returnStatus = ReturnRequest.ReturnStatus.valueOf(status.toUpperCase());
            List<ReturnRequest> requests = returnRequestService.getRequestsByStatus(returnStatus);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Buscar por email do usuário
    @GetMapping("/user/{email}")
    public ResponseEntity<List<ReturnRequest>> getRequestsByUserEmail(@PathVariable String email) {
        try {
            List<ReturnRequest> requests = returnRequestService.getRequestsByUserEmail(email);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Atualizar status da solicitação (admin)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateRequestStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        
        try {
            String status = request.get("status");
            String adminNotes = request.get("adminNotes");
            
            ReturnRequest.ReturnStatus returnStatus = ReturnRequest.ReturnStatus.valueOf(status.toUpperCase());
            ReturnRequest updatedRequest = returnRequestService.updateRequestStatus(id, returnStatus, adminNotes);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Status atualizado com sucesso!",
                "request", updatedRequest
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erro ao atualizar status: " + e.getMessage()
            ));
        }
    }
    
    // Adicionar notas do admin
    @PutMapping("/{id}/notes")
    public ResponseEntity<?> addAdminNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        
        try {
            String adminNotes = request.get("adminNotes");
            ReturnRequest updatedRequest = returnRequestService.addAdminNotes(id, adminNotes);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Notas adicionadas com sucesso!",
                "request", updatedRequest
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erro ao adicionar notas: " + e.getMessage()
            ));
        }
    }
    
    // Buscar solicitações recentes
    @GetMapping("/recent")
    public ResponseEntity<List<ReturnRequest>> getRecentRequests() {
        try {
            List<ReturnRequest> requests = returnRequestService.getRecentRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Buscar solicitações não resolvidas
    @GetMapping("/unresolved")
    public ResponseEntity<List<ReturnRequest>> getUnresolvedRequests() {
        try {
            List<ReturnRequest> requests = returnRequestService.getUnresolvedRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Buscar solicitações resolvidas
    @GetMapping("/resolved")
    public ResponseEntity<List<ReturnRequest>> getResolvedRequests() {
        try {
            List<ReturnRequest> requests = returnRequestService.getResolvedRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Obter estatísticas
    @GetMapping("/stats")
    public ResponseEntity<ReturnRequestService.ReturnRequestStats> getStats() {
        try {
            ReturnRequestService.ReturnRequestStats stats = returnRequestService.getStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Buscar por produto
    @GetMapping("/product/{productName}")
    public ResponseEntity<List<ReturnRequest>> getRequestsByProduct(@PathVariable String productName) {
        try {
            List<ReturnRequest> requests = returnRequestService.getRequestsByProduct(productName);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Buscar por nome do usuário
    @GetMapping("/user/name/{userName}")
    public ResponseEntity<List<ReturnRequest>> getRequestsByUserName(@PathVariable String userName) {
        try {
            List<ReturnRequest> requests = returnRequestService.getRequestsByUserName(userName);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Deletar solicitação (admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReturnRequest(@PathVariable Long id) {
        try {
            returnRequestService.deleteReturnRequest(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Solicitação deletada com sucesso!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erro ao deletar solicitação: " + e.getMessage()
            ));
        }
    }
    
    // Health check
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "OK", "service", "ReturnRequest"));
    }
} 