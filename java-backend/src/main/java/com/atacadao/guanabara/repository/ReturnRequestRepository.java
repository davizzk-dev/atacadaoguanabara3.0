package com.atacadao.guanabara.repository;

import com.atacadao.guanabara.model.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    
    // Buscar por status
    List<ReturnRequest> findByStatus(ReturnRequest.ReturnStatus status);
    
    // Buscar por tipo de solicitação
    List<ReturnRequest> findByRequestType(ReturnRequest.RequestType requestType);
    
    // Buscar por email do usuário
    List<ReturnRequest> findByUserEmail(String userEmail);
    
    // Buscar por número do pedido
    List<ReturnRequest> findByOrderId(String orderId);
    
    // Buscar por período de criação
    List<ReturnRequest> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Buscar solicitações pendentes
    @Query("SELECT r FROM ReturnRequest r WHERE r.status = 'PENDING' ORDER BY r.createdAt DESC")
    List<ReturnRequest> findPendingRequests();
    
    // Buscar solicitações por status e período
    @Query("SELECT r FROM ReturnRequest r WHERE r.status = :status AND r.createdAt BETWEEN :startDate AND :endDate ORDER BY r.createdAt DESC")
    List<ReturnRequest> findByStatusAndPeriod(@Param("status") ReturnRequest.ReturnStatus status, 
                                            @Param("startDate") LocalDateTime startDate, 
                                            @Param("endDate") LocalDateTime endDate);
    
    // Contar solicitações por status
    @Query("SELECT COUNT(r) FROM ReturnRequest r WHERE r.status = :status")
    long countByStatus(@Param("status") ReturnRequest.ReturnStatus status);
    
    // Buscar solicitações recentes (últimos 30 dias)
    @Query("SELECT r FROM ReturnRequest r WHERE r.createdAt >= :thirtyDaysAgo ORDER BY r.createdAt DESC")
    List<ReturnRequest> findRecentRequests(@Param("thirtyDaysAgo") LocalDateTime thirtyDaysAgo);
    
    // Buscar por produto
    List<ReturnRequest> findByProductNameContainingIgnoreCase(String productName);
    
    // Buscar por nome do usuário
    List<ReturnRequest> findByUserNameContainingIgnoreCase(String userName);
    
    // Buscar solicitações não resolvidas
    @Query("SELECT r FROM ReturnRequest r WHERE r.status IN ('PENDING', 'UNDER_REVIEW') ORDER BY r.createdAt ASC")
    List<ReturnRequest> findUnresolvedRequests();
    
    // Buscar solicitações resolvidas
    @Query("SELECT r FROM ReturnRequest r WHERE r.status IN ('APPROVED', 'REJECTED', 'COMPLETED') ORDER BY r.resolvedAt DESC")
    List<ReturnRequest> findResolvedRequests();
} 