package com.learnado.backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "live_lectures")
public class LiveLecture {
    @Id
    private String id;
    private String batchId;           // Which batch is this lecture for
    private String courseId;          // Which course this belongs to
    private String title;             // Lecture title
    private String description;       // Lecture description
    private String instructorEmail;   // Who is conducting
    private LocalDateTime scheduledAt; // When the lecture is scheduled
    private Integer durationMinutes;  // Expected duration
    private LectureStatus status;     // SCHEDULED, LIVE, COMPLETED, CANCELLED
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;  // When instructor actually started
    private LocalDateTime endedAt;    // When lecture actually ended
    
    // WebRTC room settings
    private String roomId;            // Unique room identifier (same as lecture id)
    private Boolean isScreenSharing;  // Is instructor currently screen sharing
    private Boolean isRecording;      // Is the lecture being recorded
    private Integer maxParticipants;  // Maximum allowed participants
    
    // Participant tracking
    @Builder.Default
    private List<String> joinedStudents = new ArrayList<>(); // Emails of students who joined
    private Integer peakAttendance;   // Maximum concurrent attendees
}
