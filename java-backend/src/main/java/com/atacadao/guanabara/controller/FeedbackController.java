package com.atacadao.guanabara.controller;

import com.atacadao.guanabara.model.Feedback;
import com.atacadao.guanabara.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/feedback")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FeedbackController {
    
    private final FeedbackService feedbackService;
    
    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedback() {
        try {
            List<Feedback> feedbacks = feedbackService.getAllFeedback();
            return ResponseEntity.ok(feedbacks);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<Feedback>> getPendingFeedback() {
        try {
            List<Feedback> feedbacks = feedbackService.getPendingFeedback();
            return ResponseEntity.ok(feedbacks);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable Long id) {
        try {
            return feedbackService.getFeedbackById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<Feedback> createFeedback(@RequestBody Feedback feedback) {
        try {
            Feedback createdFeedback = feedbackService.createFeedback(feedback);
            return ResponseEntity.ok(createdFeedback);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<Feedback> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String statusStr = request.get("status");
            Feedback.FeedbackStatus status = Feedback.FeedbackStatus.valueOf(statusStr.toUpperCase());
            Feedback updatedFeedback = feedbackService.updateFeedbackStatus(id, status);
            return ResponseEntity.ok(updatedFeedback);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable Long id) {
        try {
            feedbackService.deleteFeedback(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            Long pendingCount = feedbackService.getPendingFeedbackCount();
            Double averageRating = feedbackService.getAverageRating();
            Map<String, Object> stats = Map.of(
                "pendingCount", pendingCount,
                "totalCount", feedbackService.getAllFeedback().size(),
                "averageRating", averageRating != null ? averageRating : 0.0
            );
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/rating/{rating}")
    public ResponseEntity<List<Feedback>> getFeedbackByRating(@PathVariable Integer rating) {
        try {
            List<Feedback> feedbacks = feedbackService.getFeedbackByRating(rating);
            return ResponseEntity.ok(feedbacks);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
} 