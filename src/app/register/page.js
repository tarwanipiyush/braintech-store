
"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      boxSizing: "border-box",
      background: "#101116",
      color: "#f4f5fb",
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    card: {
      width: "100%",
      maxWidth: "460px",
      padding: "32px 36px",
      boxSizing: "border-box",
      border: "1px solid #33333f",
      borderRadius: "18px",
      background: "#1b1b24",
      boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
    },
    brand: {
      display: "block",
      marginBottom: "24px",
      color: "#ff4654",
      fontSize: "27px",
      fontWeight: "800",
      textAlign: "center",
      textDecoration: "none",
      letterSpacing: "-1px",
    },
    title: {
      margin: "0 0 10px",
      fontSize: "28px",
      fontWeight: "750",
      textAlign: "center",
    },
    subtitle: {
      margin: "0 0 24px",
      color: "#a6a6b5",
      fontSize: "14px",
      lineHeight: "1.7",
      textAlign: "center",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "15px",
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#e6e6ee",
    },
    input: {
      width: "100%",
      height: "46px",
      padding: "0 14px",
      boxSizing: "border-box",
      border: "1px solid #3a3a48",
      borderRadius: "9px",
      outline: "none",
      background: "#111116",
      color: "#ffffff",
      fontSize: "14px",
    },
    passwordRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    showPassword: {
      padding: "10px 0",
      border: "none",
      background: "transparent",
      color: "#ff6975",
      cursor: "pointer",
      fontSize: "13px",
    },
    submit: {
      width: "100%",
      minHeight: "48px",
      marginTop: "5px",
      border: "none",
      borderRadius: "9px",
      background: "#ff4654",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
    },
    link: {
      color: "#ff6975",
      textDecoration: "none",
    },
    message: {
      margin: "0",
      color: "#ff9da5",
      fontSize: "13px",
      lineHeight: "1.6",
    },
    bottomText: {
      margin: "22px 0 0",
      color: "#aaaab8",
      fontSize: "14px",
      lineHeight: "1.8",
      textAlign: "center",
    },
    backLink: {
      display: "block",
      marginTop: "18px",
      color: "#a6a6b5",
      fontSize: "13px",
      textAlign: "center",
      textDecoration: "none",
    },
  };

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match. Please try again.");
      return;
    }

    setMessage(
      "Your form is valid! Connect an authentication service to create your account."
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <Link href="/" style={styles.brand}>
          BrainTech
        </Link>

        <h1 style={styles.title}>Create your account</h1>

        <p style={styles.subtitle}>
          Join BrainTech and discover your next gaming upgrade.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="name" style={styles.label}>
              Full name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>

            <div style={styles.passwordRow}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
                style={{ ...styles.input, flex: 1, minWidth: 0 }}
              />

              <button
                type="button"
                style={styles.showPassword}
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Confirm password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password again"
              autoComplete="new-password"
              minLength={8}
              required
              style={styles.input}
            />
          </div>

          {message && (
            <p role="status" style={styles.message}>
              {message}
            </p>
          )}

          <button type="submit" style={styles.submit}>
            Create Account
          </button>
        </form>

        <p style={styles.bottomText}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>
            Sign in
          </Link>
        </p>

        <Link href="/" style={styles.backLink}>
          ← Back to store
        </Link>
      </section>
    </main>
  );
}