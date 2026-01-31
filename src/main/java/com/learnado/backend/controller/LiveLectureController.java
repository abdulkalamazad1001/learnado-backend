package com.learnado.backend.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learnado.backend.model.Enrollment;
import com.learnado.backend.model.LectureStatus;
import com.learnado.backend.model.LiveLecture;
import com.learnado.backend.repository.EnrollmentRepository;
import com.learnado.backend.repository.LiveLectureRepository;
import com.learnado.backend.websocket.SignalingHandler;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/live-lectures")
@RequiredArgsConstructor
public class LiveLectureController {

    private final LiveLectureRepository liveLectureRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SignalingHandler signalingHandler;

    // Create a new live lecture (Instructor only)
    @PostMapping
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public LiveLecture createLecture(@RequestBody LiveLecture lecture, Authentication auth) {
        lecture.setInstructorEmail(auth.getName());
        lecture.setCreatedAt(LocalDateTime.now());
        lecture.setStatus(LectureStatus.SCHEDULED);
        lecture.setIsScreenSharing(false);
        lecture.setIsRecording(false);
        lecture.setJoinedStudents(new ArrayList<>());
        lecture.setPeakAttendance(0);
        if (lecture.getMaxParticipants() == null) {
            lecture.setMaxParticipants(100); // Default max participants
        }
        LiveLecture saved = liveLectureRepository.save(lecture);
        saved.setRoomId(saved.getId()); // Room ID is same as lecture ID
        return liveLectureRepository.save(saved);
    }

    // Get all lectures for a batch
    @GetMapping("/batch/{batchId}")
    public List<LiveLecture> getLecturesByBatch(@PathVariable String batchId) {
        return liveLectureRepository.findByBatchIdOrderByScheduledAtDesc(batchId);
    }

    // Get all lectures for a course
    @GetMapping("/course/{courseId}")
    public List<LiveLecture> getLecturesByCourse(@PathVariable String courseId) {
        return liveLectureRepository.findByCourseIdOrderByScheduledAtDesc(courseId);
    }

    // Get upcoming lectures for a batch
    @GetMapping("/batch/{batchId}/upcoming")
    public List<LiveLecture> getUpcomingLectures(@PathVariable String batchId) {
        return liveLectureRepository.findByBatchIdAndScheduledAtAfterOrderByScheduledAtAsc(
            batchId, LocalDateTime.now()
        );
    }

    // Get instructor's lectures
    @GetMapping("/my-lectures")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public List<LiveLecture> getMyLectures(Authentication auth) {
        return liveLectureRepository.findByInstructorEmailOrderByScheduledAtDesc(auth.getName());
    }

    // Get student's upcoming lectures (from all enrolled batches)
    @GetMapping("/my-upcoming")
    @PreAuthorize("hasRole('STUDENT')")
    public List<LiveLecture> getStudentUpcomingLectures(Authentication auth) {
        // Get all batch IDs student is enrolled in
        List<String> batchIds = enrollmentRepository.findByStudentEmail(auth.getName())
            .stream()
            .map(Enrollment::getBatchId)
            .collect(Collectors.toList());
        
        if (batchIds.isEmpty()) {
            return List.of();
        }
        
        return liveLectureRepository.findByBatchIdInAndScheduledAtAfterOrderByScheduledAtAsc(
            batchIds, LocalDateTime.now()
        );
    }

    // Get all lectures for student's enrolled batches
    @GetMapping("/my-all")
    @PreAuthorize("hasRole('STUDENT')")
    public List<LiveLecture> getStudentAllLectures(Authentication auth) {
        List<String> batchIds = enrollmentRepository.findByStudentEmail(auth.getName())
            .stream()
            .map(Enrollment::getBatchId)
            .collect(Collectors.toList());
        
        if (batchIds.isEmpty()) {
            return List.of();
        }
        
        return liveLectureRepository.findByBatchIdInOrderByScheduledAtDesc(batchIds);
    }

    // Start a lecture (change status to LIVE)
    @PutMapping("/{id}/start")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<LiveLecture> startLecture(@PathVariable String id, Authentication auth) {
        return liveLectureRepository.findById(id)
            .filter(lecture -> lecture.getInstructorEmail().equals(auth.getName()))
            .map(lecture -> {
                lecture.setStatus(LectureStatus.LIVE);
                lecture.setStartedAt(LocalDateTime.now());
                return ResponseEntity.ok(liveLectureRepository.save(lecture));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // End a lecture (change status to COMPLETED)
    @PutMapping("/{id}/end")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<LiveLecture> endLecture(@PathVariable String id, Authentication auth) {
        return liveLectureRepository.findById(id)
            .filter(lecture -> lecture.getInstructorEmail().equals(auth.getName()))
            .map(lecture -> {
                lecture.setStatus(LectureStatus.COMPLETED);
                lecture.setEndedAt(LocalDateTime.now());
                return ResponseEntity.ok(liveLectureRepository.save(lecture));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Cancel a lecture
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<LiveLecture> cancelLecture(@PathVariable String id, Authentication auth) {
        return liveLectureRepository.findById(id)
            .filter(lecture -> lecture.getInstructorEmail().equals(auth.getName()))
            .map(lecture -> {
                lecture.setStatus(LectureStatus.CANCELLED);
                return ResponseEntity.ok(liveLectureRepository.save(lecture));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Update lecture details
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<LiveLecture> updateLecture(
            @PathVariable String id, 
            @RequestBody LiveLecture updatedLecture,
            Authentication auth) {
        return liveLectureRepository.findById(id)
            .filter(lecture -> lecture.getInstructorEmail().equals(auth.getName()))
            .map(lecture -> {
                lecture.setTitle(updatedLecture.getTitle());
                lecture.setDescription(updatedLecture.getDescription());
                lecture.setScheduledAt(updatedLecture.getScheduledAt());
                lecture.setDurationMinutes(updatedLecture.getDurationMinutes());
                lecture.setMaxParticipants(updatedLecture.getMaxParticipants());
                return ResponseEntity.ok(liveLectureRepository.save(lecture));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Get a specific lecture
    @GetMapping("/{id}")
    public ResponseEntity<LiveLecture> getLecture(@PathVariable String id) {
        return liveLectureRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Delete a lecture
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<Void> deleteLecture(@PathVariable String id, Authentication auth) {
        return liveLectureRepository.findById(id)
            .filter(lecture -> lecture.getInstructorEmail().equals(auth.getName()))
            .map(lecture -> {
                liveLectureRepository.delete(lecture);
                return ResponseEntity.ok().<Void>build();
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Get all currently live lectures
    @GetMapping("/live-now")
    public List<LiveLecture> getLiveLectures() {
        return liveLectureRepository.findByStatus(LectureStatus.LIVE);
    }

    // Join a lecture room (for students)
    @PostMapping("/{id}/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<LiveLecture> joinLecture(@PathVariable String id, Authentication auth) {
        String studentEmail = auth.getName();
        
        return liveLectureRepository.findById(id)
            .filter(lecture -> lecture.getStatus() == LectureStatus.LIVE)
            .map(lecture -> {
                // Add student to joined list if not already there
                if (lecture.getJoinedStudents() == null) {
                    lecture.setJoinedStudents(new ArrayList<>());
                }
                if (!lecture.getJoinedStudents().contains(studentEmail)) {
                    lecture.getJoinedStudents().add(studentEmail);
                }
                
                // Update peak attendance
                int currentCount = signalingHandler.getParticipantCount(id);
                if (lecture.getPeakAttendance() == null || currentCount > lecture.getPeakAttendance()) {
                    lecture.setPeakAttendance(currentCount);
                }
                
                return ResponseEntity.ok(liveLectureRepository.save(lecture));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Get room info including participant count
    @GetMapping("/{id}/room-info")
    public ResponseEntity<?> getRoomInfo(@PathVariable String id) {
        return liveLectureRepository.findById(id)
            .map(lecture -> {
                int participantCount = signalingHandler.getParticipantCount(id);
                return ResponseEntity.ok(java.util.Map.of(
                    "lectureId", lecture.getId(),
                    "roomId", lecture.getRoomId() != null ? lecture.getRoomId() : lecture.getId(),
                    "status", lecture.getStatus(),
                    "participantCount", participantCount,
                    "maxParticipants", lecture.getMaxParticipants() != null ? lecture.getMaxParticipants() : 100,
                    "isScreenSharing", lecture.getIsScreenSharing() != null && lecture.getIsScreenSharing(),
                    "instructorEmail", lecture.getInstructorEmail()
                ));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Update screen sharing status
    @PutMapping("/{id}/screen-share")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<LiveLecture> updateScreenShare(
            @PathVariable String id,
            @RequestBody java.util.Map<String, Boolean> body,
            Authentication auth) {
        return liveLectureRepository.findById(id)
            .filter(lecture -> lecture.getInstructorEmail().equals(auth.getName()))
            .map(lecture -> {
                lecture.setIsScreenSharing(body.getOrDefault("isScreenSharing", false));
                return ResponseEntity.ok(liveLectureRepository.save(lecture));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
