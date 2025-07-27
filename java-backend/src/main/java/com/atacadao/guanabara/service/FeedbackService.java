package com.atacadao.guanabara.service;

import com.atacadao.guanabara.model.Feedback;
import com.atacadao.guanabara.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FeedbackService {
    
    private final FeedbackRepository feedbackRepository;
    
    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAllOrderByCreatedAtDesc();
    }
    
    public List<Feedback> getFeedbackByStatus(Feedback.FeedbackStatus status) {
        return feedbackRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    public Optional<Feedback> getFeedbackById(Long id) {
        return feedbackRepository.findById(id);
    }
    
    public Feedback createFeedback(Feedback feedback) {
        return feedbackRepository.save(feedback);
    }
    
    public Feedback updateFeedbackStatus(Long id, Feedback.FeedbackStatus status) {
        Optional<Feedback> optionalFeedback = feedbackRepository.findById(id);
        if (optionalFeedback.isPresent()) {
            Feedback feedback = optionalFeedback.get();
            feedback.setStatus(status);
            return feedbackRepository.save(feedback);
        }
        throw new RuntimeException("Feedback não encontrado");
    }
    
    public void deleteFeedback(Long id) {
        feedbackRepository.deleteById(id);
    }
    
    public Long getPendingFeedbackCount() {
        return feedbackRepository.countPendingFeedback();
    }
    
    public List<Feedback> getPendingFeedback() {
        return feedbackRepository.findByStatus(Feedback.FeedbackStatus.PENDING);
    }
    
    public Double getAverageRating() {
        return feedbackRepository.getAverageRating();
    }
    
    public List<Feedback> getFeedbackByRating(Integer rating) {
        return feedbackRepository.findByRating(rating);
    }
} 