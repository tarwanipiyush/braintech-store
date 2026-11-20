"use client";

import { useState } from "react";
import Link from "next/link";
import "../admin.css";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message || "Unable to sign in. Please try again."
        );
        return;
      }

      setOtpStep(true);
      setOtp("");

      setMessage(
        data.message ||
          "Password accepted. Check your email for the OTP."
      );
    } catch (error) {
      console.error("Admin password login error:", error);

      setMessage(
        "Unable to connect to the login service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();

    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Please enter the six-digit OTP sent to your email.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message || "OTP verification failed. Please try again."
        );
        return;
      }

      if (!data.token) {
        console.error(
          "OTP verification succeeded, but the response contained no token."
        );

        setMessage(
          "Verification succeeded, but no authentication token was returned."
        );

        return;
      }

      // Store the authentication token returned by the server.
      localStorage.setItem("braintech-admin-token", data.token);

      // Store admin information for the dashboard UI.
      if (data.admin) {
        localStorage.setItem(
          "braintech-admin",
          JSON.stringify(data.admin)
        );
      }

      setMessage("Authentication successful. Opening admin dashboard...");

      // Give the browser a full navigation rather than relying
      // on the client-side router to transition to the admin page.
      window.location.assign("/admin");
    } catch (error) {
      console.error("Admin OTP verification error:", error);

      setMessage(
        "Unable to verify OTP. Please check the Next.js terminal."
      );
    } finally {
      setLoading(false);
    }
  }

  function returnToPassword() {
    setOtpStep(false);
    setOtp("");
    setMessage("");
  }

  return (
    <main className="admin-login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <Link href="/" className="admin-brand login-brand">
        <span className="brand-mark">B</span>

        <span>
          <strong>BRAINTECH</strong>
          <small>ADMIN CONSOLE</small>
        </span>
      </Link>

      <section className="login-card">
        <div className="login-icon">
          {otpStep ? "📧" : "🔐"}
        </div>

        <p className="eyebrow">RESTRICTED AREA</p>

        <h1>
          {otpStep ? "Verify your email" : "Welcome back"}
        </h1>

        <p className="login-description">
          {otpStep
            ? `Enter the six-digit verification code sent to ${email}.`
            : "Sign in to the BrainTech Store administrator console."}
        </p>

        {!otpStep ? (
          <form
            onSubmit={handleSubmit}
            className="admin-login-form"
          >
            <label htmlFor="admin-email">
              Email address
            </label>

            <input
              id="admin-email"
              type="email"
              placeholder="admin@braintechpc.in"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
              disabled={loading}
            />

            <label htmlFor="admin-password">
              Password
            </label>

            <input
              id="admin-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            <button
              className="admin-primary-button login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Please wait..." : "Continue securely"}

              {!loading && <span>→</span>}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            className="admin-login-form"
          >
            <label htmlFor="admin-otp">
              Six-digit OTP
            </label>

            <input
              id="admin-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              maxLength={6}
              required
              disabled={loading}
            />

            <button
              className="admin-primary-button login-submit"
              type="submit"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify & sign in"}

              {!loading && <span>→</span>}
            </button>

            <button
              type="button"
              className="login-back-button"
              onClick={returnToPassword}
              disabled={loading}
            >
              ← Back to password
            </button>
          </form>
        )}

        {message && (
          <p className="login-notice" role="status">
            {message}
          </p>
        )}

        <div className="login-security-note">
          <span>🛡️</span>

          <p>
            Protected with password authentication, email verification
            and server-side sessions.
          </p>
        </div>
      </section>

      <p className="login-footer">
        © {new Date().getFullYear()} BrainTech Store · Admin access only
      </p>
    </main>
  );
}