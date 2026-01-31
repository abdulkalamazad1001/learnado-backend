import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Learn Without <span className={styles.highlight}>Limits</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Join thousands of students learning from expert instructors. 
            Discover courses, enroll in batches, and start your learning journey today.
          </p>
          <div className={styles.heroCta}>
            <Link href="/courses" className={styles.primaryBtn}>
              Explore Courses
            </Link>
            <Link href="/register" className={styles.secondaryBtn}>
              Get Started Free
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <span className={styles.heroEmoji}>📚</span>
            <h3>100+ Courses</h3>
            <p>Learn at your own pace</p>
          </div>
          <div className={styles.heroCard}>
            <span className={styles.heroEmoji}>👨‍🏫</span>
            <h3>Expert Instructors</h3>
            <p>Learn from the best</p>
          </div>
          <div className={styles.heroCard}>
            <span className={styles.heroEmoji}>🎓</span>
            <h3>Flexible Batches</h3>
            <p>Choose your schedule</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Why Choose Learnado?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🎯</span>
            <h3>Structured Learning</h3>
            <p>Organized courses with clear learning paths to help you achieve your goals.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>👥</span>
            <h3>Batch System</h3>
            <p>Join batches with other students for collaborative learning experiences.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>💼</span>
            <h3>Teach & Earn</h3>
            <p>Are you an expert? Create courses and share your knowledge with the world.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📱</span>
            <h3>Learn Anywhere</h3>
            <p>Access your courses from any device, anytime, anywhere.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Ready to Start Learning?</h2>
          <p>Join Learnado today and unlock your potential.</p>
          <div className={styles.ctaButtons}>
            <Link href="/register?role=STUDENT" className={styles.ctaBtn}>
              <span>🎓</span>
              Start Learning
            </Link>
            <Link href="/register?role=INSTRUCTOR" className={styles.ctaBtnAlt}>
              <span>👨‍🏫</span>
              Start Teaching
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>📚 Learnado</span>
            <p>Empowering learners worldwide</p>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/courses">Courses</Link>
            <Link href="/login">Login</Link>
            <Link href="/register">Sign Up</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2026 Learnado. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
