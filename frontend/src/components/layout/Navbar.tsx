"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import styles from "./Navbar.module.css";

export function Navbar() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>📚</span>
            Learnado
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>📚</span>
          Learnado
        </Link>

        <div className={styles.navLinks}>
          <Link href="/courses" className={styles.navLink}>
            Courses
          </Link>
          {isAuthenticated && (
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
          )}
        </div>

        <div className={styles.authSection}>
          {isAuthenticated ? (
            <>
              <span className={styles.userInfo}>
                <span className={styles.userRole}>{user?.role}</span>
                <span className={styles.userEmail}>{user?.email}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
