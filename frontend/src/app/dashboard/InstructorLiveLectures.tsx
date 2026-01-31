"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Textarea,
} from "@/components/ui";
import type { LiveLecture, Course, Batch } from "@/types";
import styles from "./live-lectures.module.css";

export function InstructorLiveLectures() {
  const router = useRouter();
  const { user } = useAuth();
  const [lectures, setLectures] = useState<LiveLecture[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Record<string, Batch[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Create lecture form
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [form, setForm] = useState({
    batchId: "",
    title: "",
    description: "",
    scheduledAt: "",
    durationMinutes: "60",
    maxParticipants: "100",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [lecturesData, allCourses] = await Promise.all([
        api.getMyLectures(),
        api.getAllCourses(),
      ]);

      const myCourses = allCourses.filter(
        (c) => c.instructorEmail === user?.email
      );
      setCourses(myCourses);
      setLectures(lecturesData);

      // Fetch batches for each course
      const batchesMap: Record<string, Batch[]> = {};
      for (const course of myCourses) {
        const courseBatches = await api.getBatchesByCourse(course.id);
        batchesMap[course.id] = courseBatches;
      }
      setBatches(batchesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.email]);

  const handleCreateLecture = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !form.batchId) {
      alert("Please select a course and batch");
      return;
    }

    setIsCreating(true);
    try {
      await api.createLiveLecture({
        batchId: form.batchId,
        courseId: selectedCourseId,
        title: form.title,
        description: form.description,
        scheduledAt: form.scheduledAt,
        durationMinutes: parseInt(form.durationMinutes),
        maxParticipants: parseInt(form.maxParticipants),
      });

      setForm({
        batchId: "",
        title: "",
        description: "",
        scheduledAt: "",
        durationMinutes: "60",
        maxParticipants: "100",
      });
      setSelectedCourseId("");
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create lecture");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartLecture = async (id: string) => {
    try {
      await api.startLecture(id);
      // Navigate to the lecture room
      router.push(`/lecture/${id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start lecture");
    }
  };

  const handleJoinLecture = (id: string) => {
    router.push(`/lecture/${id}`);
  };

  const handleEndLecture = async (id: string) => {
    try {
      await api.endLecture(id);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to end lecture");
    }
  };

  const handleCancelLecture = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this lecture?")) return;
    try {
      await api.cancelLecture(id);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel lecture");
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return styles.statusLive;
      case "SCHEDULED":
        return styles.statusScheduled;
      case "COMPLETED":
        return styles.statusCompleted;
      case "CANCELLED":
        return styles.statusCancelled;
      default:
        return "";
    }
  };

  const getCourseTitle = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || "Unknown Course";
  };

  const getBatchName = (batchId: string) => {
    for (const courseBatches of Object.values(batches)) {
      const batch = courseBatches.find((b) => b.id === batchId);
      if (batch) return batch.batchName;
    }
    return "Unknown Batch";
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading lectures...</p>
      </div>
    );
  }

  return (
    <div className={styles.liveLectures}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Live Lectures</h2>
          <p className={styles.subtitle}>Schedule and manage your live sessions</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Schedule Lecture</Button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Create Lecture Modal */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <Card className={styles.modal}>
            <CardHeader>
              <h2 className={styles.modalTitle}>Schedule Live Lecture</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLecture} className={styles.form}>
                <div className={styles.selectGroup}>
                  <label className={styles.label}>Select Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setForm({ ...form, batchId: "" });
                    }}
                    className={styles.select}
                    required
                  >
                    <option value="">Choose a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCourseId && (
                  <div className={styles.selectGroup}>
                    <label className={styles.label}>Select Batch</label>
                    <select
                      value={form.batchId}
                      onChange={(e) =>
                        setForm({ ...form, batchId: e.target.value })
                      }
                      className={styles.select}
                      required
                    >
                      <option value="">Choose a batch</option>
                      {batches[selectedCourseId]?.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batchName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Input
                  label="Lecture Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Introduction to React Hooks"
                  required
                />

                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="What will be covered in this lecture?"
                />

                <Input
                  label="Scheduled Date & Time"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm({ ...form, scheduledAt: e.target.value })
                  }
                  required
                />

                <Input
                  label="Duration (minutes)"
                  type="number"
                  min="15"
                  max="300"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value })
                  }
                  required
                />

                <Input
                  label="Max Participants"
                  type="number"
                  min="2"
                  max="500"
                  value={form.maxParticipants}
                  onChange={(e) =>
                    setForm({ ...form, maxParticipants: e.target.value })
                  }
                  required
                />

                <div className={styles.modalActions}>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isCreating}>
                    Schedule Lecture
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lectures List */}
      {lectures.length === 0 ? (
        <Card className={styles.emptyState}>
          <CardContent>
            <span className={styles.emptyIcon}>🎥</span>
            <h3>No lectures scheduled</h3>
            <p>Schedule your first live lecture to engage with your students!</p>
            <Button onClick={() => setShowForm(true)}>Schedule Lecture</Button>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.lecturesList}>
          {lectures.map((lecture) => (
            <Card key={lecture.id} className={styles.lectureCard}>
              <CardContent>
                <div className={styles.lectureHeader}>
                  <div>
                    <span
                      className={`${styles.statusBadge} ${getStatusColor(lecture.status)}`}
                    >
                      {lecture.status === "LIVE" && "🔴 "}
                      {lecture.status}
                    </span>
                    <h3 className={styles.lectureTitle}>{lecture.title}</h3>
                    <p className={styles.lectureMeta}>
                      {getCourseTitle(lecture.courseId)} • {getBatchName(lecture.batchId)}
                    </p>
                  </div>
                </div>

                {lecture.description && (
                  <p className={styles.lectureDescription}>{lecture.description}</p>
                )}

                <div className={styles.lectureDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>📅 Scheduled</span>
                    <span>{formatDateTime(lecture.scheduledAt)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>⏱️ Duration</span>
                    <span>{lecture.durationMinutes} minutes</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>👥 Max</span>
                    <span>{lecture.maxParticipants || 100} participants</span>
                  </div>
                </div>

                <div className={styles.lectureActions}>
                  {lecture.status === "SCHEDULED" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleStartLecture(lecture.id)}
                      >
                        🔴 Start & Join Lecture
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleCancelLecture(lecture.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {lecture.status === "LIVE" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleJoinLecture(lecture.id)}
                      >
                        🔴 Join Lecture Room
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleEndLecture(lecture.id)}
                      >
                        End Lecture
                      </Button>
                    </>
                  )}
                  {lecture.status === "COMPLETED" && (
                    <span className={styles.completedText}>
                      Ended at {formatDateTime(lecture.endedAt || "")}
                      {lecture.peakAttendance && ` • Peak: ${lecture.peakAttendance} attendees`}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
