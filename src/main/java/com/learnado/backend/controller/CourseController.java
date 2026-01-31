package com.learnado.backend.controller;

import com.learnado.backend.model.Course;
import com.learnado.backend.repository.CourseRepository;
import com.learnado.backend.service.FileService; // For your file upload requirement
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseRepository courseRepository;
    private final FileService fileService; // Added for Requirement 6.3

    // 1. Basic List (Return all)
    @GetMapping
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    // 2. Advanced: Pagination & Sorting (Requirement 6.3)
    @GetMapping("/all")
    public Page<Course> getCoursesWithPagination(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "title") String sortBy
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return courseRepository.findAll(pageable);
    }

    // 3. Search by Title (Requirement 6.3)
    @GetMapping("/search")
    public List<Course> searchCourses(@RequestParam String title) {
        return courseRepository.findByTitleContainingIgnoreCase(title);
    }

    // 4. Create Course (Instructor Only - Requirement 6.1/6.2)
    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public Course createCourse(@RequestBody Course course, Authentication auth) {
        course.setInstructorEmail(auth.getName());
        course.setCreatedAt(LocalDateTime.now());
        return courseRepository.save(course);
    }

    // 5. File Upload (Requirement 6.3 & 6.4)
    @PostMapping("/{courseId}/upload-thumbnail")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<String> uploadThumbnail(
            @PathVariable String courseId,
            @RequestParam("file") MultipartFile file) throws IOException {

        String fileUrl = fileService.uploadFile(file);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Make sure you have added this field to your Course model first!
        // course.setThumbnailUrl(fileUrl);
        // courseRepository.save(course);

        return ResponseEntity.ok("File uploaded successfully: " + fileUrl);
    }
}