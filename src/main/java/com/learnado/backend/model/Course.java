package com.learnado.backend.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "courses") // This creates a "courses" table in MongoDB
public class Course {
    @Id
    private String id;
    private String title;
    private String description;
    private Double price;
    private String instructorEmail; // Who created this course?
    private LocalDateTime createdAt;
}