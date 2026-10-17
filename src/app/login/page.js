
"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
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
      maxWidth: "430px",
      padding: "36px",
      boxSizing: "border-box",
      border: "1px solid #33333f",
      borderRadius: "18px",
      background: "#1b1b24",
      boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
    },
    brand: {
      display: "block",
      marginBottom: "30px",
      color: "#ff4654",
      fontSize: "27px",
      fontWeight: "800",
      textAlign: "center",
      textDecoration: "none",
      letterSpacing: "-1px",
    },
    title: {
      margin: "0 0 10px",
      fontSize: "30px",
      fontWeight: "750",
      textAlign: "center",
    },
    subtitle: {
      margin: "0 0 28px",
      color: "#a6a6b5",
      fontSize: "14px",
      lineHeight: "1.7",
      textAlign: "center",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "18px",
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
      height: "48px",
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
    options: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "12px",
      color: "#b8b8c5",
      fontSize: "13px",
    },
    remember: {
      display: "flex",
      alignItems: "center",
      gap: "7px",
    },
    link: {
      color: "#ff6975",
      textDecoration: "none",
    },
    submit: {
      width: "100%",
      minHeight: "49px",
      marginTop: "4px",
      border: "none",
      borderRadius: "9px",
      background: "#ff4654",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
    },
    message: {
      margin: "0",
      color: "#ff9da5",
      fontSize: "13px",
      lineHeight: "1.6",
    },
    bottomText: {
      margin: "24px 0 0",
      color: "#aaaab8",
      fontSize: "14px",
      lineHeight: "1.8",
      textAlign: "center",
    },
    backLink: {
      display: "block",
      marginTop: "22px",
      color: "#a6a6b5",
      fontSize: "13px",
      textAlign: "center",
      textDecoration: "none",
    },
  };

  function handleSubmit(event) {
    event.preventDefault();
    setMessage(
      "The login form is ready. Connect an authentication service to enable real sign-in."
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <Link href="/" style={styles.brand}>
          BrainTech
        </Link>

        <h1 style={styles.title}>Welcome back</h1>

        <p style={styles.subtitle}>
          Sign in to continue to your gaming gear store.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
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
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                style={{
                  ...styles.input,
                  flex: 1,
                  minWidth: 0,
                }}
              />

              <button
                type="button"
                style={styles.showPassword}
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={styles.options}>
            <label style={styles.remember}>
              <input
                type="checkbox"
                name="remember"
                style={{ accentColor: "#ff4654" }}
              />
              Remember me
            </label>

            <Link
              href="/forgot-password"
              style={styles.link}
            >
              Forgot password?
            </Link>
          </div>

          {message && (
            <p role="status" style={styles.message}>
              {message}
            </p>
          )}

          <button type="submit" style={styles.submit}>
            Sign In
          </button>
        </form>

        <p style={styles.bottomText}>
          New to BrainTech?{" "}
          <Link href="/register" style={styles.link}>
            Register here
          </Link>
        </p>

        <Link href="/" style={styles.backLink}>
          ← Back to store
        </Link>
      </section>
    </main>
  );
}
