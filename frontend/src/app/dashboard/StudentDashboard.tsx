"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, Button } from "@/components/ui";
import { StudentLiveLectures } from "./StudentLiveLectures";
import type { Enrollment, Batch, Course } from "@/types";
import styles from "./dashboard.module.css";

interface EnrollmentWithDetails extends Enrollment {
  batch?: Batch;
  course?: Course;
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"courses" | "lectures">("courses");
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEnrollments = async () => {
      setIsLoading(true);
      try {
        const enrollmentsData = await api.getMyEnrollments();
        // Get all courses to match with enrollments
        const courses = await api.getAllCourses();

        // Enrich enrollments with batch and course details
        const enrichedEnrollments = await Promise.all(
          enrollmentsData.map(async (enrollment) => {
            // Find which course this batch belongs to
            for (const course of courses) {
              const batches = await api.getBatchesByCourse(course.id);
              const batch = batches.find((b) => b.id === enrollment.batchId);
              if (batch) {
                return { ...enrollment, batch, course };
              }
            }
            return enrollment;
          })
        );

        setEnrollments(enrichedEnrollments);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch enrollments"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>My Learning</h1>
          <p className={styles.dashboardSubtitle}>
            Welcome back! Continue your learning journey.
          </p>
        </div>
        {activeTab === "courses" && (
          <Link href="/courses">
            <Button>Browse Courses</Button>
          </Link>
        )}
      </div>

      {/* Dashboard Tabs */}
      <div className={styles.dashboardTabs}>
        <button
          className={`${styles.dashboardTab} ${activeTab === "courses" ? styles.dashboardTabActive : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          📚 My Courses
        </button>
        <button
          className={`${styles.dashboardTab} ${activeTab === "lectures" ? styles.dashboardTabActive : ""}`}
          onClick={() => setActiveTab("lectures")}
        >
          🎥 Live Lectures
        </button>
      </div>

      {activeTab === "lectures" ? (
        <StudentLiveLectures />
      ) : (
        <>
          {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <CardContent>
            <span className={styles.statIcon}>📚</span>
            <span className={styles.statValue}>{enrollments.length}</span>
            <span className={styles.statLabel}>Enrolled Courses</span>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <span className={styles.statIcon}>✅</span>
            <span className={styles.statValue}>
              {enrollments.filter((e) => e.status === "PAID").length}
            </span>
            <span className={styles.statLabel}>Active Enrollments</span>
          </CardContent>
        </Card>
        <Card className={styles.statCard}>
          <CardContent>
            <span className={styles.statIcon}>🎓</span>
            <span className={styles.statValue}>{user?.email}</span>
            <span className={styles.statLabel}>Student Account</span>
          </CardContent>
        </Card>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>My Enrolled Courses</h2>

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading your courses...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <Card className={styles.emptyState}>
            <CardContent>
              <span className={styles.emptyIcon}>📖</span>
              <h3>No courses yet</h3>
              <p>Start your learning journey by enrolling in a course!</p>
              <Link href="/courses">
                <Button>Explore Courses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className={styles.enrollmentGrid}>
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className={styles.enrollmentCard}>
                <div className={styles.enrollmentImage}>
                  <span className={styles.courseEmoji}>📖</span>
                </div>
                <CardContent>
                  <h3 className={styles.enrollmentTitle}>
                    {enrollment.course?.title || "Course"}
                  </h3>
                  <p className={styles.enrollmentBatch}>
                    Batch: {enrollment.batch?.batchName || "N/A"}
                  </p>
                  <div className={styles.enrollmentMeta}>
                    <span
                      className={`${styles.statusBadge} ${enrollment.status === "PAID" ? styles.statusPaid : styles.statusPending}`}
                    >
                      {enrollment.status}
                    </span>
                    <span className={styles.enrollmentDate}>
                      Enrolled: {formatDate(enrollment.enrolledAt)}
                    </span>
                  </div>
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
