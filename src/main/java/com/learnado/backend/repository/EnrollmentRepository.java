package com.learnado.backend.repository;

import com.learnado.backend.model.Enrollment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface EnrollmentRepository extends MongoRepository<Enrollment, String> {
    List<Enrollment> findByStudentEmail(String email);
    boolean existsByStudentEmailAndBatchId(String email, String batchId);
}