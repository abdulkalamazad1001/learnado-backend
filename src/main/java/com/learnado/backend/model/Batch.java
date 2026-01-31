package com.learnado.backend.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "batches")
public class Batch {
    @Id
    private String id;
    private String courseId; // Links this batch to a course
    private String batchName; // Example: "Morning Batch"
    private Integer maxStudents;
    private LocalDateTime startDate;
    private String instructorEmail; // Who is teaching this batch?

    public void setCreatedAt(LocalDateTime now) {
        this.startDate = now;
    }
}