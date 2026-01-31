"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Input, Card, CardContent, CardHeader } from "@/components/ui";
import type { Role } from "@/types";
import styles from "../login/auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT" as Role,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <Card className={styles.authCard}>
        <CardHeader>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join Learnado today</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorAlert}>{error}</div>}
            {success && <div className={styles.successAlert}>{success}</div>}

            <Input
              label="Full Name"
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />

            <div className={styles.roleSelector}>
              <label className={styles.roleLabel}>I want to:</label>
              <div className={styles.roleOptions}>
                <button
                  type="button"
                  className={`${styles.roleOption} ${formData.role === "STUDENT" ? styles.roleActive : ""}`}
                  onClick={() => setFormData({ ...formData, role: "STUDENT" })}
                >
                  <span className={styles.roleIcon}>🎓</span>
                  <span>Learn</span>
                  <span className={styles.roleDesc}>As a Student</span>
                </button>
                <button
                  type="button"
                  className={`${styles.roleOption} ${formData.role === "INSTRUCTOR" ? styles.roleActive : ""}`}
                  onClick={() =>
                    setFormData({ ...formData, role: "INSTRUCTOR" })
                  }
                >
                  <span className={styles.roleIcon}>👨‍🏫</span>
                  <span>Teach</span>
                  <span className={styles.roleDesc}>As an Instructor</span>
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Create Account
            </Button>
          </form>

          <p className={styles.footerText}>
            Already have an account?{" "}
            <Link href="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
