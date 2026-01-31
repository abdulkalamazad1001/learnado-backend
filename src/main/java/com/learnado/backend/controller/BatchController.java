package com.learnado.backend.controller;

import com.learnado.backend.model.Batch;
import com.learnado.backend.repository.BatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
public class BatchController {

    private final BatchRepository batchRepository;

    // 1. Create a Batch (Only for Instructors)
    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public Batch createBatch(@RequestBody Batch batch, Authentication auth) {
        batch.setInstructorEmail(auth.getName()); // Automatically set teacher email
        batch.setCreatedAt(LocalDateTime.now());
        return batchRepository.save(batch);
    }

    // 2. Get all batches for a specific course
    @GetMapping("/course/{courseId}")
    public List<Batch> getBatchesByCourse(@PathVariable String courseId) {
        return batchRepository.findByCourseId(courseId);
    }
}