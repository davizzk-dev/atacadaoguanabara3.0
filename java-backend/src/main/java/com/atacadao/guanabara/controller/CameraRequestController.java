package com.atacadao.guanabara.controller;

import com.atacadao.guanabara.model.CameraRequest;
import com.atacadao.guanabara.service.CameraRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/camera-requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CameraRequestController {
    
    private final CameraRequestService cameraRequestService;
    
    @GetMapping
    public ResponseEntity<List<CameraRequest>> getAllRequests() {
        try {
            List<CameraRequest> requests = cameraRequestService.getAllRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<CameraRequest>> getPendingRequests() {
        try {
            List<CameraRequest> requests = cameraRequestService.getPendingRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CameraRequest> getRequestById(@PathVariable Long id) {
        try {
            return cameraRequestService.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<CameraRequest> createRequest(@RequestBody CameraRequest request) {
        try {
            CameraRequest createdRequest = cameraRequestService.createRequest(request);
            return ResponseEntity.ok(createdRequest);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<CameraRequest> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String statusStr = request.get("status");
            CameraRequest.RequestStatus status = CameraRequest.RequestStatus.valueOf(statusStr.toUpperCase());
            CameraRequest updatedRequest = cameraRequestService.updateRequestStatus(id, status);
            return ResponseEntity.ok(updatedRequest);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        try {
            cameraRequestService.deleteRequest(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            Long pendingCount = cameraRequestService.getPendingRequestsCount();
            Map<String, Object> stats = Map.of(
                "pendingCount", pendingCount,
                "totalCount", cameraRequestService.getAllRequests().size()
            );
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
} 