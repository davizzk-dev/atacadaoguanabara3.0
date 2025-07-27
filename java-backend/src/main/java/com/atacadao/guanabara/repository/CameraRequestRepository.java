package com.atacadao.guanabara.repository;

import com.atacadao.guanabara.model.CameraRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CameraRequestRepository extends JpaRepository<CameraRequest, Long> {
    
    List<CameraRequest> findByStatus(CameraRequest.RequestStatus status);
    
    @Query("SELECT COUNT(c) FROM CameraRequest c WHERE c.status = 'PENDING'")
    Long countPendingRequests();
    
    @Query("SELECT c FROM CameraRequest c ORDER BY c.createdAt DESC")
    List<CameraRequest> findAllOrderByCreatedAtDesc();
    
    List<CameraRequest> findByStatusOrderByCreatedAtDesc(CameraRequest.RequestStatus status);
} 