"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, CardContent } from "@/components/ui";
import type { Course, Batch } from "@/types";
import styles from "../courses.module.css";

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollingBatchId, setEnrollingBatchId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseAndBatches = async () => {
      setIsLoading(true);
      try {
        const [coursesData, batchesData] = await Promise.all([
          api.getAllCourses(),
          api.getBatchesByCourse(id),
        ]);
        const foundCourse = coursesData.find((c) => c.id === id);
        if (!foundCourse) {
          setError("Course not found");
        } else {
          setCourse(foundCourse);
          setBatches(batchesData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseAndBatches();
  }, [id]);

  const handleEnroll = async (batchId: string) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "STUDENT") {
      alert("Only students can enroll in courses");
      return;
    }

    setEnrollingBatchId(batchId);
    try {
      await api.enrollInBatch(batchId);
      alert("Successfully enrolled!");
      router.push("/dashboard");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to enroll");
    } finally {
      setEnrollingBatchId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className={styles.courseDetailPage}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={styles.courseDetailPage}>
        <Link href="/courses" className={styles.backLink}>
          ← Back to Courses
        </Link>
        <div className={styles.error}>{error || "Course not found"}</div>
      </div>
    );
  }

  return (
    <div className={styles.courseDetailPage}>
      <Link href="/courses" className={styles.backLink}>
        ← Back to Courses
      </Link>

      <div className={styles.courseDetail}>
        <div className={styles.detailImage}>
          <span className={styles.courseEmoji}>📖</span>
        </div>

        <div className={styles.detailContent}>
          <div className={styles.detailHeader}>
            <h1 className={styles.detailTitle}>{course.title}</h1>
            <span className={styles.detailPrice}>
              {formatPrice(course.price)}
            </span>
          </div>

          <p className={styles.detailDescription}>{course.description}</p>

          <div className={styles.detailMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Instructor</span>
              <span className={styles.metaValue}>{course.instructorEmail}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>
                {formatDate(course.createdAt)}
              </span>
            </div>
          </div>

          {/* Batches Section */}
          <div className={styles.batchesSection}>
            <div className={styles.batchesHeader}>
              <h2 className={styles.batchesTitle}>Available Batches</h2>
            </div>

            {batches.length === 0 ? (
              <div className={styles.noBatches}>
                <p>No batches available for this course yet.</p>
              </div>
            ) : (
              <div className={styles.batchesList}>
                {batches.map((batch) => (
                  <Card key={batch.id} className={styles.batchCard}>
                    <div className={styles.batchInfo}>
                      <span className={styles.batchName}>{batch.batchName}</span>
                      <span className={styles.batchMeta}>
                        Max Students: {batch.maxStudents} • Starts:{" "}
                        {formatDate(batch.startDate)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleEnroll(batch.id)}
                      isLoading={enrollingBatchId === batch.id}
                      disabled={user?.role !== "STUDENT" && isAuthenticated}
                    >
                      {!isAuthenticated
                        ? "Login to Enroll"
                        : user?.role !== "STUDENT"
                          ? "Students Only"
                          : "Enroll Now"}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
