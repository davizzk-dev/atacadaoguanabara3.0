package com.atacadao.guanabara.service;

import com.atacadao.guanabara.model.ReturnRequest;
import com.atacadao.guanabara.repository.ReturnRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReturnRequestService {
    
    @Autowired
    private ReturnRequestRepository returnRequestRepository;
    
    // Diretório para salvar as fotos
    private static final String UPLOAD_DIR = "uploads/returns/";
    
    // Criar nova solicitação
    public ReturnRequest createReturnRequest(ReturnRequest returnRequest, List<MultipartFile> photos) {
        try {
            // Salvar fotos se fornecidas
            if (photos != null && !photos.isEmpty()) {
                List<String> photoUrls = savePhotos(photos);
                returnRequest.setPhotoUrls(photoUrls);
            }
            
            // Definir status inicial
            returnRequest.setStatus(ReturnRequest.ReturnStatus.PENDING);
            returnRequest.setCreatedAt(LocalDateTime.now());
            returnRequest.setUpdatedAt(LocalDateTime.now());
            
            return returnRequestRepository.save(returnRequest);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao criar solicitação de troca/devolução", e);
        }
    }
    
    // Buscar todas as solicitações
    public List<ReturnRequest> getAllReturnRequests() {
        return returnRequestRepository.findAll();
    }
    
    // Buscar por ID
    public ReturnRequest getReturnRequestById(Long id) {
        return returnRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada"));
    }
    
    // Buscar solicitações pendentes
    public List<ReturnRequest> getPendingRequests() {
        return returnRequestRepository.findPendingRequests();
    }
    
    // Buscar por status
    public List<ReturnRequest> getRequestsByStatus(ReturnRequest.ReturnStatus status) {
        return returnRequestRepository.findByStatus(status);
    }
    
    // Buscar por email do usuário
    public List<ReturnRequest> getRequestsByUserEmail(String email) {
        return returnRequestRepository.findByUserEmail(email);
    }
    
    // Atualizar status da solicitação
    public ReturnRequest updateRequestStatus(Long id, ReturnRequest.ReturnStatus status, String adminNotes) {
        ReturnRequest request = getReturnRequestById(id);
        request.setStatus(status);
        if (adminNotes != null && !adminNotes.trim().isEmpty()) {
            request.setAdminNotes(adminNotes);
        }
        return returnRequestRepository.save(request);
    }
    
    // Adicionar notas do admin
    public ReturnRequest addAdminNotes(Long id, String adminNotes) {
        ReturnRequest request = getReturnRequestById(id);
        request.setAdminNotes(adminNotes);
        return returnRequestRepository.save(request);
    }
    
    // Buscar solicitações recentes (últimos 30 dias)
    public List<ReturnRequest> getRecentRequests() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return returnRequestRepository.findRecentRequests(thirtyDaysAgo);
    }
    
    // Buscar solicitações não resolvidas
    public List<ReturnRequest> getUnresolvedRequests() {
        return returnRequestRepository.findUnresolvedRequests();
    }
    
    // Buscar solicitações resolvidas
    public List<ReturnRequest> getResolvedRequests() {
        return returnRequestRepository.findResolvedRequests();
    }
    
    // Contar solicitações por status
    public long countByStatus(ReturnRequest.ReturnStatus status) {
        return returnRequestRepository.countByStatus(status);
    }
    
    // Buscar por período
    public List<ReturnRequest> getRequestsByPeriod(LocalDateTime startDate, LocalDateTime endDate) {
        return returnRequestRepository.findByCreatedAtBetween(startDate, endDate);
    }
    
    // Buscar por produto
    public List<ReturnRequest> getRequestsByProduct(String productName) {
        return returnRequestRepository.findByProductNameContainingIgnoreCase(productName);
    }
    
    // Buscar por nome do usuário
    public List<ReturnRequest> getRequestsByUserName(String userName) {
        return returnRequestRepository.findByUserNameContainingIgnoreCase(userName);
    }
    
    // Deletar solicitação (apenas admin)
    public void deleteReturnRequest(Long id) {
        ReturnRequest request = getReturnRequestById(id);
        returnRequestRepository.delete(request);
    }
    
    // Salvar fotos
    private List<String> savePhotos(List<MultipartFile> photos) throws IOException {
        // Criar diretório se não existir
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        List<String> photoUrls = new java.util.ArrayList<>();
        
        for (MultipartFile photo : photos) {
            if (!photo.isEmpty()) {
                // Gerar nome único para o arquivo
                String fileName = UUID.randomUUID().toString() + "_" + photo.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                
                // Salvar arquivo
                Files.copy(photo.getInputStream(), filePath);
                
                // Adicionar URL à lista
                photoUrls.add("/uploads/returns/" + fileName);
            }
        }
        
        return photoUrls;
    }
    
    // Obter estatísticas
    public ReturnRequestStats getStats() {
        ReturnRequestStats stats = new ReturnRequestStats();
        stats.setTotalRequests(returnRequestRepository.count());
        stats.setPendingRequests(returnRequestRepository.countByStatus(ReturnRequest.ReturnStatus.PENDING));
        stats.setUnderReviewRequests(returnRequestRepository.countByStatus(ReturnRequest.ReturnStatus.UNDER_REVIEW));
        stats.setApprovedRequests(returnRequestRepository.countByStatus(ReturnRequest.ReturnStatus.APPROVED));
        stats.setRejectedRequests(returnRequestRepository.countByStatus(ReturnRequest.ReturnStatus.REJECTED));
        stats.setCompletedRequests(returnRequestRepository.countByStatus(ReturnRequest.ReturnStatus.COMPLETED));
        
        // Calcular porcentagens
        long total = stats.getTotalRequests();
        if (total > 0) {
            stats.setPendingPercentage((double) stats.getPendingRequests() / total * 100);
            stats.setUnderReviewPercentage((double) stats.getUnderReviewRequests() / total * 100);
            stats.setApprovedPercentage((double) stats.getApprovedRequests() / total * 100);
            stats.setRejectedPercentage((double) stats.getRejectedRequests() / total * 100);
            stats.setCompletedPercentage((double) stats.getCompletedRequests() / total * 100);
        }
        
        return stats;
    }
    
    // Classe interna para estatísticas
    public static class ReturnRequestStats {
        private long totalRequests;
        private long pendingRequests;
        private long underReviewRequests;
        private long approvedRequests;
        private long rejectedRequests;
        private long completedRequests;
        private double pendingPercentage;
        private double underReviewPercentage;
        private double approvedPercentage;
        private double rejectedPercentage;
        private double completedPercentage;
        
        // Getters e Setters
        public long getTotalRequests() { return totalRequests; }
        public void setTotalRequests(long totalRequests) { this.totalRequests = totalRequests; }
        
        public long getPendingRequests() { return pendingRequests; }
        public void setPendingRequests(long pendingRequests) { this.pendingRequests = pendingRequests; }
        
        public long getUnderReviewRequests() { return underReviewRequests; }
        public void setUnderReviewRequests(long underReviewRequests) { this.underReviewRequests = underReviewRequests; }
        
        public long getApprovedRequests() { return approvedRequests; }
        public void setApprovedRequests(long approvedRequests) { this.approvedRequests = approvedRequests; }
        
        public long getRejectedRequests() { return rejectedRequests; }
        public void setRejectedRequests(long rejectedRequests) { this.rejectedRequests = rejectedRequests; }
        
        public long getCompletedRequests() { return completedRequests; }
        public void setCompletedRequests(long completedRequests) { this.completedRequests = completedRequests; }
        
        public double getPendingPercentage() { return pendingPercentage; }
        public void setPendingPercentage(double pendingPercentage) { this.pendingPercentage = pendingPercentage; }
        
        public double getUnderReviewPercentage() { return underReviewPercentage; }
        public void setUnderReviewPercentage(double underReviewPercentage) { this.underReviewPercentage = underReviewPercentage; }
        
        public double getApprovedPercentage() { return approvedPercentage; }
        public void setApprovedPercentage(double approvedPercentage) { this.approvedPercentage = approvedPercentage; }
        
        public double getRejectedPercentage() { return rejectedPercentage; }
        public void setRejectedPercentage(double rejectedPercentage) { this.rejectedPercentage = rejectedPercentage; }
        
        public double getCompletedPercentage() { return completedPercentage; }
        public void setCompletedPercentage(double completedPercentage) { this.completedPercentage = completedPercentage; }
    }
} 