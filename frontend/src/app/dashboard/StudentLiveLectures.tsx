"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, Button } from "@/components/ui";
import type { LiveLecture } from "@/types";
import styles from "./live-lectures.module.css";

export function StudentLiveLectures() {
  const router = useRouter();
  const [upcomingLectures, setUpcomingLectures] = useState<LiveLecture[]>([]);
  const [allLectures, setAllLectures] = useState<LiveLecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "all">("upcoming");

  const fetchLectures = async () => {
    setIsLoading(true);
    try {
      const [upcoming, all] = await Promise.all([
        api.getStudentUpcomingLectures(),
        api.getStudentAllLectures(),
      ]);
      setUpcomingLectures(upcoming);
      setAllLectures(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch lectures");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

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

  const isLectureJoinable = (lecture: LiveLecture) => {
    if (lecture.status === "LIVE") return true;
    if (lecture.status !== "SCHEDULED") return false;

    // Allow joining 10 minutes before scheduled time
    const scheduledTime = new Date(lecture.scheduledAt);
    const now = new Date();
    const minutesBefore = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    return minutesBefore <= 10;
  };

  const lectures = activeTab === "upcoming" ? upcomingLectures : allLectures;

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
          <p className={styles.subtitle}>Join your scheduled live sessions</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "upcoming" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming ({upcomingLectures.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Lectures ({allLectures.length})
        </button>
      </div>

      {/* Live Now Banner */}
      {upcomingLectures.some((l) => l.status === "LIVE") && (
        <div className={styles.liveBanner}>
          <span className={styles.liveIndicator}>🔴 LIVE NOW</span>
          <p>You have lectures happening right now!</p>
        </div>
      )}

      {/* Lectures List */}
      {lectures.length === 0 ? (
        <Card className={styles.emptyState}>
          <CardContent>
            <span className={styles.emptyIcon}>🎥</span>
            <h3>No {activeTab} lectures</h3>
            <p>
              {activeTab === "upcoming"
                ? "You don't have any upcoming live lectures scheduled."
                : "You haven't had any live lectures yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.lecturesList}>
          {lectures.map((lecture) => (
            <Card
              key={lecture.id}
              className={`${styles.lectureCard} ${lecture.status === "LIVE" ? styles.lectureCardLive : ""}`}
            >
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
                      by {lecture.instructorEmail}
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
                </div>

                <div className={styles.lectureActions}>
                  {lecture.status === "LIVE" ? (
                    <Button
                      onClick={() => router.push(`/lecture/${lecture.id}`)}
                    >
                      🔴 Join Live Lecture
                    </Button>
                  ) : lecture.status === "SCHEDULED" ? (
                    <Button
                      variant="secondary"
                      disabled
                    >
                      Starts {formatDateTime(lecture.scheduledAt)}
                    </Button>
                  ) : lecture.status === "COMPLETED" ? (
                    <span className={styles.completedText}>
                      Lecture ended
                    </span>
                  ) : (
                    <span className={styles.cancelledText}>
                      Lecture was cancelled
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
