package com.atacadao.guanabara.service;

import com.atacadao.guanabara.model.CameraRequest;
import com.atacadao.guanabara.repository.CameraRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CameraRequestService {
    
    private final CameraRequestRepository cameraRequestRepository;
    
    public List<CameraRequest> getAllRequests() {
        return cameraRequestRepository.findAllOrderByCreatedAtDesc();
    }
    
    public List<CameraRequest> getRequestsByStatus(CameraRequest.RequestStatus status) {
        return cameraRequestRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    public Optional<CameraRequest> getRequestById(Long id) {
        return cameraRequestRepository.findById(id);
    }
    
    public CameraRequest createRequest(CameraRequest request) {
        return cameraRequestRepository.save(request);
    }
    
    public CameraRequest updateRequestStatus(Long id, CameraRequest.RequestStatus status) {
        Optional<CameraRequest> optionalRequest = cameraRequestRepository.findById(id);
        if (optionalRequest.isPresent()) {
            CameraRequest request = optionalRequest.get();
            request.setStatus(status);
            return cameraRequestRepository.save(request);
        }
        throw new RuntimeException("Solicitação não encontrada");
    }
    
    public void deleteRequest(Long id) {
        cameraRequestRepository.deleteById(id);
    }
    
    public Long getPendingRequestsCount() {
        return cameraRequestRepository.countPendingRequests();
    }
    
    public List<CameraRequest> getPendingRequests() {
        return cameraRequestRepository.findByStatus(CameraRequest.RequestStatus.PENDING);
    }
} 