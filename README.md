**Overview**

- **Project**: Learnado — backend and frontend for a live-learning platform.
- **Backend**: Spring Boot (Java 17), MongoDB, JWT auth, WebSocket signaling for real-time live lectures.
- **Frontend**: Next.js 16 + React 19 (in `frontend`). See [frontend/package.json](frontend/package.json).

**Key Features**

- **User Authentication**: JWT-based register/login endpoints in `src/main/java/com/learnado/backend/controller/AuthController.java`.
- **Role-based Access**: Instructor and Student roles enforced via Spring Security (`SecurityConfig.java`).
- **Courses & Batches**: Create/list/search courses and batches (`CourseController.java`, `BatchController.java`).
- **Enrollments**: Students can join batches and view their enrollments (`EnrollmentController.java`).
- **Live Lectures**: Schedule, start, join, update, and end live lectures with room info and participant counts (`LiveLectureController.java`).
- **WebSocket Signaling**: Real-time signaling endpoint at `/ws/lecture/*` handled by `WebSocketConfig.java` and `SignalingHandler`.
- **File Uploads**: Cloudinary-friendly file upload pipeline referenced in `CourseController.java` via `FileService`.
- **Email Support**: `spring-boot-starter-mail` included for notifications and invites.

**Tech Stack**

- **Backend**: Spring Boot 3.x, Java 17, Spring Security, Spring Data MongoDB, WebSocket
- **Auth**: jjwt (JSON Web Tokens)
- **Storage**: MongoDB (Atlas connection used in `application.properties` by default)
- **Frontend**: Next.js, React

**Quickstart (Local dev)**

- Prereqs: Java 17, Maven, Node.js (for frontend), MongoDB (or Atlas URI).
- Backend: run from repo root.

```bash
# Windows
.\mvnw.cmd spring-boot:run
# Unix
./mvnw spring-boot:run
```

- Frontend: change into `frontend` and run Next dev server.

```bash
cd frontend
npm install
npm run dev
```

**Environment & Configuration**

- Default backend port: `8080` (see [src/main/resources/application.properties](src/main/resources/application.properties)).
- Important env vars to set (examples):

```text
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
SPRING_MAIL_HOST=smtp.example.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=mailer@example.com
SPRING_MAIL_PASSWORD=secret
```

**API Reference (high level)**

- **Auth** (`/api/auth`)
  - POST `/register` : register a new user. See [AuthController.java](src/main/java/com/learnado/backend/controller/AuthController.java).
  - POST `/login` : login returns JWT.

- **Courses** (`/api/courses`)
  - GET `/` : list all courses.
  - GET `/all` : paginated courses (params: `page`, `size`, `sortBy`).
  - GET `/search?title=...` : search by title.
  - POST `/` : create course (Instructor only).
  - POST `/{courseId}/upload-thumbnail` : upload file (Instructor only).

- **Batches** (`/api/batches`)
  - POST `/` : create a batch (Instructor only).
  - GET `/course/{courseId}` : list batches for a course.

- **Enrollments** (`/api/enrollments`)
  - POST `/join/{batchId}` : student enrolls in a batch.
  - GET `/my-courses` : student enrolled courses.

- **Live Lectures** (`/api/live-lectures`)
  - POST `/` : create lecture (Instructor only).
  - GET `/batch/{batchId}` : lectures for a batch.
  - GET `/course/{courseId}` : lectures for a course.
  - GET `/batch/{batchId}/upcoming` : upcoming for batch.
  - GET `/my-lectures` : instructor lectures.
  - GET `/my-upcoming` : student upcoming lectures.
  - PUT `/{id}/start` : start lecture (Instructor only).
  - PUT `/{id}/end` : end lecture (Instructor only).
  - POST `/{id}/join` : student joins live lecture (updates participant list).
  - GET `/{id}/room-info` : get room participant count and room metadata.

Notes: Protected routes require `Authorization: Bearer <token>` header; see `JwtAuthFilter.java` and `SecurityConfig.java`.

**WebSocket (Signaling) — Live Lecture rooms**

- Endpoint: connect to `ws://<host>:8080/ws/lecture/{lectureId}` (or `wss://` in production).
- Handshake interceptors extract `lectureId` and pass it to `SignalingHandler` (see [WebSocketConfig.java](src/main/java/com/learnado/backend/config/WebSocketConfig.java)).
- Use WebSocket for exchanging SDP/ICE/peer events to establish WebRTC connections between instructor and students.

**Frontend Notes**

- The frontend is a Next.js app in the `frontend` folder. It includes `useWebRTC.ts` (hook) and pages for courses, lectures, auth flows.
- Dev script: `npm run dev` (see [frontend/package.json](frontend/package.json)).

**Database & Storage**

- MongoDB is used for persistence (models under `src/main/java/com/learnado/backend/model`).
- Cloudinary is integrated for thumbnail/uploads (dependency in `pom.xml`).

**Security**

- JWT-based stateless auth: tokens extracted from `Authorization` header and validated by `JwtAuthFilter`.
- Passwords hashed with BCrypt (`SecurityConfig.java`).
- CORS permitted for `http://localhost:3000` by default.

**Testing & Linting**

- Backend tests: standard Spring Boot test setup (see `src/test`).
- Frontend linting/formatting: `biome` scripts in `frontend/package.json`.
