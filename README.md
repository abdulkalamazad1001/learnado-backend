# Learnado - Live Learning Education Platform

Deployment Link: https://learnado-backend-uiy5.onrender.com

Learnado is a full-stack live-learning platform combining a Spring Boot Java backend with a Next.js React frontend. It supports role-based authentication, course & batch management, student enrollments, and real-time live lectures using WebSocket signaling for WebRTC-based audio/video sessions.

This README is crafted to help developers and maintainers quickly understand architecture, run the project locally, and integrate with the live-lecture stack. It prioritizes clarity, security, and actionable steps for development and deployment.

**Why this repo matters**: Learnado is designed to be a production-oriented reference for building synchronous learning experiences — low-latency signalling, scalable persistence with MongoDB, secure JWT auth, and an example Next.js client.

---

## Quick Summary

- Languages & frameworks: Java 17, Spring Boot 3.x, MongoDB, WebSocket, Next.js 16, React 19
- Authentication: JWT tokens (jjwt), BCrypt password hashing
- Real-time: Custom WebSocket signaling handler at `/ws/lecture/{lectureId}` for WebRTC peer negotiation
- Storage: MongoDB (Atlas-friendly), Cloudinary for media uploads (dependency included)

---

## How to Use This README

- Start with **Quickstart** to run the app locally.
- Read **Architecture & Features** to understand implemented modules and endpoints.
- Use **API Reference** and **WebSocket** for integration details (client, automated tests, or Postman).

---

## Quickstart (Local Development)

Prerequisites

- Java 17 (JDK)
- Maven (bundled wrappers included)
- Node.js + npm (for frontend)
- MongoDB or a MongoDB Atlas URI

Start backend

```bash
# Windows
.\mvnw.cmd spring-boot:run
# Unix / Git Bash
./mvnw spring-boot:run
```

Start frontend

```bash
cd frontend
npm install
npm run dev
```

Open the frontend at `http://localhost:3000` and the backend at `http://localhost:8080` (default).

---

## Architecture & Features (Implemented)

- **Auth & Security**
  - JWT-based authentication with `Authorization: Bearer <token>` header.
  - Passwords hashed with BCrypt (`SecurityConfig.java`).
  - `JwtAuthFilter` validates tokens on incoming requests.
  - Method-level role checks via `@PreAuthorize` (Instructor vs Student).

- **Courses & Batches**
  - CRUD-lite for `Course` and `Batch` models.
  - Course search, pagination, and sorting endpoints in `CourseController.java`.

- **Enrollments**
  - Student-only enrollment via `EnrollmentController.java`.
  - Query enrolled courses with `GET /api/enrollments/my-courses`.

- **Live Lectures**
  - Schedule, start, end, cancel, and update lectures in `LiveLectureController.java`.
  - Live lecture metadata stores `roomId`, `peakAttendance`, `joinedStudents`, screen-share flags, recording flags.

- **Real-time Signaling (WebSocket)**
  - `WebSocketConfig.java` registers handler at `/ws/lecture/*`.
  - Signaling handler (`SignalingHandler`) manages SDP/ICE/peer messages and participant counts used by `LiveLectureController`.

- **File Uploads & Email**
  - Cloudinary dependency present for uploads; `FileService` is referenced from controllers.
  - `spring-boot-starter-mail` included for outbound emails.

---

## Environment & Configuration

The project is configured with sensible defaults in `src/main/resources/application.properties` (default port 8080). Replace sensitive values with environment variables or a secure secrets provider before production.

Recommended environment variables

```
MONGO_URI=your_mongo_connection_string
JWT_SECRET=super-secret-jwt-key
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
SPRING_MAIL_HOST=smtp.example.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=mailer@example.com
SPRING_MAIL_PASSWORD=secret
```

Note: `application.properties` currently contains a MongoDB Atlas URI — remove or replace it for public repositories.

---

## API Reference (Practical)

All endpoints are relative to the backend base URL (default `http://localhost:8080`). Protected routes require an `Authorization` header.

Authentication

- POST `/api/auth/register` — register a new user. Accepts `RegisterRequest` JSON.
- POST `/api/auth/login` — login and receive JWT `LoginResponse`.

Courses

- GET `/api/courses` — list all courses.
- GET `/api/courses/all?page=0&size=10&sortBy=title` — paginated + sorted.
- GET `/api/courses/search?title=term` — search by title.
- POST `/api/courses` — create a course (requires `ROLE_INSTRUCTOR`).
- POST `/api/courses/{courseId}/upload-thumbnail` — multipart file upload (instructor only).

Batches

- POST `/api/batches` — create batch (instructor only).
- GET `/api/batches/course/{courseId}` — get batches for course.

Enrollments

- POST `/api/enrollments/join/{batchId}` — student joins a batch.
- GET `/api/enrollments/my-courses` — list student's enrollments.

Live Lectures

- POST `/api/live-lectures` — create lecture (instructor only).
- GET `/api/live-lectures/batch/{batchId}` — get lectures of a batch.
- GET `/api/live-lectures/course/{courseId}` — get lectures of a course.
- GET `/api/live-lectures/batch/{batchId}/upcoming` — upcoming lectures.
- GET `/api/live-lectures/my-lectures` — instructor lectures.
- GET `/api/live-lectures/my-upcoming` — student's upcoming lectures (based on enrollment).
- PUT `/api/live-lectures/{id}/start` — start lecture (instructor only).
- PUT `/api/live-lectures/{id}/end` — end lecture (instructor only).
- PUT `/api/live-lectures/{id}/screen-share` — toggle screen-sharing flag (instructor only).
- POST `/api/live-lectures/{id}/join` — student joins live lecture; updates participant list and peak attendance.
- GET `/api/live-lectures/{id}/room-info` — returns `participantCount`, `maxParticipants`, `isScreenSharing`, and `instructorEmail`.

Quick curl example (login)

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@example.com","password":"password"}'
```

---

## WebSocket Signaling (Client Integration)

- Connect to: `ws://<host>:8080/ws/lecture/{lectureId}`
- The server handshake interceptor extracts `{lectureId}` and assigns it to the socket session attributes.
- Typical client flow:
  1. Authenticate and obtain JWT.
  2. Open WebSocket to `/ws/lecture/{lectureId}` and exchange signaling messages (SDP offers/answers, ICE candidates, join/leave events).
  3. Use a local WebRTC peer connection (browser) and send/receive SDP through WebSocket.

Example (conceptual):

```js
const ws = new WebSocket('ws://localhost:8080/ws/lecture/12345');
ws.onmessage = (m) => console.log('signaling', m.data);
// send { type: 'offer', sdp: '...' } etc.
```

---

## Contributing

- Fork the repo, create a feature branch from `main`, implement changes, add tests, and open a PR.
- Keep API and DB migrations backward-compatible where possible.

---

## Acknowledgements

- Built with Spring Boot, Next.js and WebRTC principles.

---
