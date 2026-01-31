"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Input, Card, CardContent, CardFooter } from "@/components/ui";
import type { Course } from "@/types";
import styles from "./courses.module.css";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCourses = async (search?: string) => {
    setIsLoading(true);
    setError("");
    try {
      const data = search
        ? await api.searchCourses(search)
        : await api.getAllCourses();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses(searchQuery);
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
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={styles.coursesPage}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Explore Courses</h1>
          <p className={styles.subtitle}>
            Discover courses taught by expert instructors
          </p>
        </div>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <Button type="submit">Search</Button>
        </form>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📚</span>
          <h2>No courses found</h2>
          <p>
            {searchQuery
              ? "Try a different search term"
              : "Be the first to create a course!"}
          </p>
        </div>
      ) : (
        <div className={styles.coursesGrid}>
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className={styles.courseLink}
            >
              <Card hoverable className={styles.courseCard}>
                <div className={styles.courseImage}>
                  <span className={styles.courseEmoji}>📖</span>
                </div>
                <CardContent>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseDescription}>
                    {course.description}
                  </p>
                  <div className={styles.courseMeta}>
                    <span className={styles.courseInstructor}>
                      👨‍🏫 {course.instructorEmail}
                    </span>
                    <span className={styles.courseDate}>
                      {formatDate(course.createdAt)}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <span className={styles.coursePrice}>
                    {formatPrice(course.price)}
                  </span>
                  <Button size="sm">View Details</Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
