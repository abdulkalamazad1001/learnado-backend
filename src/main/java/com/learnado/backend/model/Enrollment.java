package com.learnado.backend.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "enrollments")
public class Enrollment {
    @Id
    private String id;
    private String studentEmail; // The student who enrolled
    private String batchId;      // The batch they joined
    private LocalDateTime enrolledAt;
    private String status;       // Example: "PAID" or "PENDING"
}