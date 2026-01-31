"use client";

import { useState, useEffect, type FormEvent } from "react";
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
import { InstructorLiveLectures } from "./InstructorLiveLectures";
import type { Course, Batch } from "@/types";
import styles from "./dashboard.module.css";

export function InstructorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"courses" | "lectures">("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Create course form
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    price: "",
  });

  // Create batch form
  const [showBatchForm, setShowBatchForm] = useState<string | null>(null);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    batchName: "",
    maxStudents: "",
    startDate: "",
  });

  // Batches by course
  const [batchesByCourse, setBatchesByCourse] = useState<
    Record<string, Batch[]>
  >({});

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const allCourses = await api.getAllCourses();
      const myCourses = allCourses.filter(
        (c) => c.instructorEmail === user?.email
      );
      setCourses(myCourses);

      // Fetch batches for each course
      const batchesMap: Record<string, Batch[]> = {};
      for (const course of myCourses) {
        const batches = await api.getBatchesByCourse(course.id);
        batchesMap[course.id] = batches;
      }
      setBatchesByCourse(batchesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user?.email]);

  const handleCreateCourse = async (e: FormEvent) => {
    e.preventDefault();
    setIsCreatingCourse(true);
    try {
      await api.createCourse({
        title: courseForm.title,
        description: courseForm.description,
        price: parseFloat(courseForm.price),
      });
      setCourseForm({ title: "", description: "", price: "" });
      setShowCourseForm(false);
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleCreateBatch = async (e: FormEvent, courseId: string) => {
    e.preventDefault();
    setIsCreatingBatch(true);
    try {
      await api.createBatch({
        courseId,
        batchName: batchForm.batchName,
        maxStudents: parseInt(batchForm.maxStudents),
        startDate: batchForm.startDate,
      });
      setBatchForm({ batchName: "", maxStudents: "", startDate: "" });
      setShowBatchForm(null);
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create batch");
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Instructor Dashboard</h1>
          <p className={styles.dashboardSubtitle}>
            Manage your courses and batches
          </p>
        </div>
        {activeTab === "courses" && (
          <Button onClick={() => setShowCourseForm(true)}>
            + Create Course
          </Button>
        )}
      </div>

      {/* Dashboard Tabs */}
      <div className={styles.dashboardTabs}>
        <button
          className={`${styles.dashboardTab} ${activeTab === "courses" ? styles.dashboardTabActive : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          📚 Courses & Batches
        </button>
        <button
          className={`${styles.dashboardTab} ${activeTab === "lectures" ? styles.dashboardTabActive : ""}`}
          onClick={() => setActiveTab("lectures")}
        >
          🎥 Live Lectures
        </button>
      </div>

      {activeTab === "lectures" ? (
        <InstructorLiveLectures />
      ) : (
        <>
          {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <CardContent>
            <span className={styles.statIcon}>📚</span>
            <span className={styles.statValue}>{courses.length}</span>
            <span className={styles.statLabel}>Total Courses</span>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <span className={styles.statIcon}>👥</span>
            <span className={styles.statValue}>
              {Object.values(batchesByCourse).flat().length}
            </span>
            <span className={styles.statLabel}>Total Batches</span>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <span className={styles.statIcon}>👨‍🏫</span>
            <span className={styles.statValue}>{user?.email}</span>
            <span className={styles.statLabel}>Instructor Account</span>
          </CardContent>
        </Card>
      </div>

      {/* Create Course Modal */}
      {showCourseForm && (
        <div className={styles.modalOverlay}>
          <Card className={styles.modal}>
            <CardHeader>
              <h2 className={styles.modalTitle}>Create New Course</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCourse} className={styles.form}>
                <Input
                  label="Course Title"
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  placeholder="e.g., Introduction to React"
                  required
                />
                <Textarea
                  label="Description"
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your course..."
                  required
                />
                <Input
                  label="Price (USD)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={courseForm.price}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, price: e.target.value })
                  }
                  placeholder="49.99"
                  required
                />
                <div className={styles.modalActions}>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowCourseForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isCreatingCourse}>
                    Create Course
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Courses Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>My Courses</h2>

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <Card className={styles.emptyState}>
            <CardContent>
              <span className={styles.emptyIcon}>📝</span>
              <h3>No courses yet</h3>
              <p>Create your first course to start teaching!</p>
              <Button onClick={() => setShowCourseForm(true)}>
                Create Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={styles.coursesList}>
            {courses.map((course) => (
              <Card key={course.id} className={styles.instructorCourseCard}>
                <CardContent>
                  <div className={styles.courseHeader}>
                    <div>
                      <h3 className={styles.courseTitle}>{course.title}</h3>
                      <p className={styles.courseDescription}>
                        {course.description}
                      </p>
                      <div className={styles.courseMeta}>
                        <span className={styles.coursePrice}>
                          {formatPrice(course.price)}
                        </span>
                        <span className={styles.courseDate}>
                          Created: {formatDate(course.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowBatchForm(course.id)}
                    >
                      + Add Batch
                    </Button>
                  </div>

                  {/* Create Batch Form */}
                  {showBatchForm === course.id && (
                    <form
                      onSubmit={(e) => handleCreateBatch(e, course.id)}
                      className={styles.batchForm}
                    >
                      <Input
                        label="Batch Name"
                        value={batchForm.batchName}
                        onChange={(e) =>
                          setBatchForm({
                            ...batchForm,
                            batchName: e.target.value,
                          })
                        }
                        placeholder="e.g., Morning Batch"
                        required
                      />
                      <Input
                        label="Max Students"
                        type="number"
                        min="1"
                        value={batchForm.maxStudents}
                        onChange={(e) =>
                          setBatchForm({
                            ...batchForm,
                            maxStudents: e.target.value,
                          })
                        }
                        placeholder="30"
                        required
                      />
                      <Input
                        label="Start Date"
                        type="datetime-local"
                        value={batchForm.startDate}
                        onChange={(e) =>
                          setBatchForm({
                            ...batchForm,
                            startDate: e.target.value,
                          })
                        }
                        required
                      />
                      <div className={styles.batchFormActions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => setShowBatchForm(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          type="submit"
                          isLoading={isCreatingBatch}
                        >
                          Create Batch
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Batches List */}
                  {batchesByCourse[course.id]?.length > 0 && (
                    <div className={styles.batchesList}>
                      <h4 className={styles.batchesLabel}>Batches:</h4>
                      {batchesByCourse[course.id].map((batch) => (
                        <div key={batch.id} className={styles.batchItem}>
                          <span className={styles.batchName}>
                            {batch.batchName}
                          </span>
                          <span className={styles.batchDetails}>
                            {batch.maxStudents} students • Starts:{" "}
                            {formatDate(batch.startDate)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}
