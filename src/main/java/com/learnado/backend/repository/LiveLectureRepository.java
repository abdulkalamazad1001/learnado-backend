package com.learnado.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.learnado.backend.model.LectureStatus;
import com.learnado.backend.model.LiveLecture;

@Repository
public interface LiveLectureRepository extends MongoRepository<LiveLecture, String> {
    
    // Find all lectures for a batch
    List<LiveLecture> findByBatchIdOrderByScheduledAtDesc(String batchId);
    
    // Find all lectures for a course
    List<LiveLecture> findByCourseIdOrderByScheduledAtDesc(String courseId);
    
    // Find lectures by instructor
    List<LiveLecture> findByInstructorEmailOrderByScheduledAtDesc(String instructorEmail);
    
    // Find upcoming lectures (scheduled after now)
    List<LiveLecture> findByBatchIdAndScheduledAtAfterOrderByScheduledAtAsc(String batchId, LocalDateTime now);
    
    // Find live lectures currently happening
    List<LiveLecture> findByStatus(LectureStatus status);
    
    // Find lectures by batch and status
    List<LiveLecture> findByBatchIdAndStatus(String batchId, LectureStatus status);
    
    // Find upcoming lectures for a student's batches
    List<LiveLecture> findByBatchIdInAndScheduledAtAfterOrderByScheduledAtAsc(List<String> batchIds, LocalDateTime now);
    
    // Find all lectures for multiple batches
    List<LiveLecture> findByBatchIdInOrderByScheduledAtDesc(List<String> batchIds);
}
