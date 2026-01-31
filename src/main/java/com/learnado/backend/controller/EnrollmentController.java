package com.learnado.backend.controller;

import com.learnado.backend.model.Enrollment;
import com.learnado.backend.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;

    @PostMapping("/join/{batchId}")
    @PreAuthorize("hasRole('STUDENT')") // ONLY Students can enroll
    public Enrollment enrollInBatch(@PathVariable String batchId, Authentication auth) {
        String email = auth.getName();

        // Check if already enrolled
        if (enrollmentRepository.existsByStudentEmailAndBatchId(email, batchId)) {
            throw new RuntimeException("You are already in this batch!");
        }

        Enrollment enrollment = Enrollment.builder()
                .studentEmail(email)
                .batchId(batchId)
                .enrolledAt(LocalDateTime.now())
                .status("PAID")
                .build();

        return enrollmentRepository.save(enrollment);
    }

    @GetMapping("/my-courses")
    @PreAuthorize("hasRole('STUDENT')")
    public List<Enrollment> getMyEnrollments(Authentication auth) {
        return enrollmentRepository.findByStudentEmail(auth.getName());
    }
}