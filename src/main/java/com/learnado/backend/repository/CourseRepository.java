package com.learnado.backend.repository;

import com.learnado.backend.model.Course;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CourseRepository extends MongoRepository<Course, String> {
    // Find all courses created by a specific instructor
    List<Course> findByInstructorEmail(String email);

    // NEW: Search for courses where the title contains a specific word (case-insensitive)
    List<Course> findByTitleContainingIgnoreCase(String title);
}