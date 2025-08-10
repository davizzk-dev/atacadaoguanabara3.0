package com.atacadao.guanabara.repository;

import com.atacadao.guanabara.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    
    List<Feedback> findByStatus(Feedback.FeedbackStatus status);
    
    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.status = 'PENDING'")
    Long countPendingFeedback();
    
    @Query("SELECT f FROM Feedback f ORDER BY f.createdAt DESC")
    List<Feedback> findAllOrderByCreatedAtDesc();
    
    List<Feedback> findByStatusOrderByCreatedAtDesc(Feedback.FeedbackStatus status);
    
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.status = 'REVIEWED'")
    Double getAverageRating();
    
    List<Feedback> findByRating(Integer rating);
} 