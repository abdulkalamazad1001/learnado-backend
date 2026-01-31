"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { StudentDashboard } from "./StudentDashboard";
import { InstructorDashboard } from "./InstructorDashboard";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={styles.dashboardPage}>
      {user.role === "STUDENT" ? (
        <StudentDashboard />
      ) : user.role === "INSTRUCTOR" ? (
        <InstructorDashboard />
      ) : (
        <div className={styles.adminDashboard}>
          <h1>Admin Dashboard</h1>
          <p>Welcome, Admin! Full admin features coming soon.</p>
        </div>
      )}
    </div>
  );
}
