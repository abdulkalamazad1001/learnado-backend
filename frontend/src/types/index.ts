// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT";

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message: string;
  userId: string;
  email: string;
  role: Role;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role?: Role;
}

export interface RegisterResponse {
  message: string;
  userId: string;
  email: string;
}

// Course types
export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructorEmail: string;
  createdAt: string;
}

export interface CourseCreateRequest {
  title: string;
  description: string;
  price: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Batch types
export interface Batch {
  id: string;
  courseId: string;
  batchName: string;
  maxStudents: number;
  startDate: string;
  instructorEmail: string;
}

export interface BatchCreateRequest {
  courseId: string;
  batchName: string;
  maxStudents: number;
  startDate: string;
}

// Enrollment types
export interface Enrollment {
  id: string;
  studentEmail: string;
  batchId: string;
  enrolledAt: string;
  status: "PAID" | "PENDING";
}

// Live Lecture types
export type LectureStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";

export interface LiveLecture {
  id: string;
  batchId: string;
  courseId: string;
  title: string;
  description: string;
  instructorEmail: string;
  scheduledAt: string;
  durationMinutes: number;
  status: LectureStatus;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  roomId?: string;
  isScreenSharing?: boolean;
  isRecording?: boolean;
  maxParticipants?: number;
  joinedStudents?: string[];
  peakAttendance?: number;
}

export interface LiveLectureCreateRequest {
  batchId: string;
  courseId: string;
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants?: number;
}

export interface RoomInfo {
  lectureId: string;
  roomId: string;
  status: LectureStatus;
  participantCount: number;
  maxParticipants: number;
  isScreenSharing: boolean;
  instructorEmail: string;
}

// WebRTC signaling types
export interface SignalingMessage {
  type: string;
  [key: string]: unknown;
}

export interface Participant {
  sessionId: string;
  email: string;
  role: string;
  name: string;
}

export interface ChatMessage {
  fromSessionId: string;
  fromEmail: string;
  fromName: string;
  fromRole: string;
  message: string;
  timestamp: number;
}

// Auth context types
export interface AuthState {
  user: {
    id: string;
    email: string;
    role: Role;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Error response
export interface ErrorResponse {
  message: string;
  status: number;
  timestamp: string;
}
