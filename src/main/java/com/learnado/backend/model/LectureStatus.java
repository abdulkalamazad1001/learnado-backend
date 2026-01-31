package com.learnado.backend.model;

public enum LectureStatus {
    SCHEDULED,   // Lecture is scheduled for future
    LIVE,        // Lecture is currently happening
    COMPLETED,   // Lecture has ended
    CANCELLED    // Lecture was cancelled
}
