import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  Course,
  CourseCreateRequest,
  PaginatedResponse,
  Batch,
  BatchCreateRequest,
  Enrollment,
  LiveLecture,
  LiveLectureCreateRequest,
  RoomInfo,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Course endpoints
  async getAllCourses(): Promise<Course[]> {
    return this.request<Course[]>("/courses");
  }

  async getCoursesWithPagination(
    page = 0,
    size = 10,
    sortBy = "title"
  ): Promise<PaginatedResponse<Course>> {
    return this.request<PaginatedResponse<Course>>(
      `/courses/all?page=${page}&size=${size}&sortBy=${sortBy}`
    );
  }

  async searchCourses(title: string): Promise<Course[]> {
    return this.request<Course[]>(`/courses/search?title=${encodeURIComponent(title)}`);
  }

  async createCourse(data: CourseCreateRequest): Promise<Course> {
    return this.request<Course>("/courses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Batch endpoints
  async getBatchesByCourse(courseId: string): Promise<Batch[]> {
    return this.request<Batch[]>(`/batches/course/${courseId}`);
  }

  async createBatch(data: BatchCreateRequest): Promise<Batch> {
    return this.request<Batch>("/batches", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Enrollment endpoints
  async enrollInBatch(batchId: string): Promise<Enrollment> {
    return this.request<Enrollment>(`/enrollments/join/${batchId}`, {
      method: "POST",
    });
  }

  async getMyEnrollments(): Promise<Enrollment[]> {
    return this.request<Enrollment[]>("/enrollments/my-courses");
  }

  // Live Lecture endpoints
  async createLiveLecture(data: LiveLectureCreateRequest): Promise<LiveLecture> {
    return this.request<LiveLecture>("/live-lectures", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLecturesByBatch(batchId: string): Promise<LiveLecture[]> {
    return this.request<LiveLecture[]>(`/live-lectures/batch/${batchId}`);
  }

  async getLecturesByCourse(courseId: string): Promise<LiveLecture[]> {
    return this.request<LiveLecture[]>(`/live-lectures/course/${courseId}`);
  }

  async getUpcomingLecturesByBatch(batchId: string): Promise<LiveLecture[]> {
    return this.request<LiveLecture[]>(`/live-lectures/batch/${batchId}/upcoming`);
  }

  async getMyLectures(): Promise<LiveLecture[]> {
    return this.request<LiveLecture[]>("/live-lectures/my-lectures");
  }

  async getStudentUpcomingLectures(): Promise<LiveLecture[]> {
    return this.request<LiveLecture[]>("/live-lectures/my-upcoming");
  }

  async getStudentAllLectures(): Promise<LiveLecture[]> {
    return this.request<LiveLecture[]>("/live-lectures/my-all");
  }

  async getLecture(id: string): Promise<LiveLecture> {
    return this.request<LiveLecture>(`/live-lectures/${id}`);
  }

  async startLecture(id: string): Promise<LiveLecture> {
    return this.request<LiveLecture>(`/live-lectures/${id}/start`, {
      method: "PUT",
    });
  }

  async endLecture(id: string): Promise<LiveLecture> {
    return this.request<LiveLecture>(`/live-lectures/${id}/end`, {
      method: "PUT",
    });
  }

  async cancelLecture(id: string): Promise<LiveLecture> {
    return this.request<LiveLecture>(`/live-lectures/${id}/cancel`, {
      method: "PUT",
    });
  }

  async updateLecture(id: string, data: Partial<LiveLectureCreateRequest>): Promise<LiveLecture> {
    return this.request<LiveLecture>(`/live-lectures/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteLecture(id: string): Promise<void> {
    return this.request<void>(`/live-lectures/${id}`, {
      method: "DELETE",
    });
  }

  async getLiveLecturesNow(): Promise<LiveLecture[]> {
    return this.request<LiveLecture[]>("/live-lectures/live-now");
  }

  async joinLecture(id: string): Promise<LiveLecture> {
    return this.request<LiveLecture>(`/live-lectures/${id}/join`, {
      method: "POST",
    });
  }

  async getRoomInfo(id: string): Promise<RoomInfo> {
    return this.request<RoomInfo>(`/live-lectures/${id}/room-info`);
  }

  async updateScreenShare(id: string, isScreenSharing: boolean): Promise<LiveLecture> {
    return this.request<LiveLecture>(`/live-lectures/${id}/screen-share`, {
      method: "PUT",
      body: JSON.stringify({ isScreenSharing }),
    });
  }
}

export const api = new ApiClient();
