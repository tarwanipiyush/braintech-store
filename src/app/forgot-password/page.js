
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
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
    icon: {
      width: "58px",
      height: "58px",
      margin: "0 auto 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "16px",
      background: "rgba(255,70,84,0.12)",
      color: "#ff6975",
      fontSize: "28px",
    },
    title: {
      margin: "0 0 12px",
      fontSize: "28px",
      fontWeight: "750",
      textAlign: "center",
    },
    subtitle: {
      margin: "0 0 28px",
      color: "#a6a6b5",
      fontSize: "14px",
      lineHeight: "1.8",
      textAlign: "center",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
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
    submit: {
      width: "100%",
      minHeight: "49px",
      marginTop: "8px",
      border: "none",
      borderRadius: "9px",
      background: "#ff4654",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
    },
    message: {
      marginTop: "18px",
      padding: "12px",
      border: "1px solid #3a3a48",
      borderRadius: "9px",
      color: "#ffb0b7",
      fontSize: "13px",
      lineHeight: "1.7",
      overflowWrap: "anywhere",
    },
    backLink: {
      display: "block",
      marginTop: "24px",
      color: "#ff6975",
      fontSize: "14px",
      textAlign: "center",
      textDecoration: "none",
    },
  };

  function handleSubmit(event) {
    event.preventDefault();

    setMessage(
      "Your email has been entered successfully. Password recovery is not connected yet. Connect an authentication service to send a real reset email."
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <Link href="/" style={styles.brand}>
          BrainTech
        </Link>

        <div style={styles.icon} aria-hidden="true">
          ✉
        </div>

        <h1 style={styles.title}>Forgot password?</h1>

        <p style={styles.subtitle}>
          No worries! Enter the email address associated with
          your account, and we'll help you recover access.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor="email" style={styles.label}>
            Email address
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setMessage("");
            }}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.submit}>
            Reset Password
          </button>
        </form>

        {message && (
          <p role="status" aria-live="polite" style={styles.message}>
            {message}
          </p>
        )}

        <Link href="/login" style={styles.backLink}>
          ← Back to Sign In
        </Link>
      </section>
    </main>
  );
}
