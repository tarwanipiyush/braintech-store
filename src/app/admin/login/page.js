
"use client";

import { useState } from "react";
import Link from "next/link";
import "../admin.css";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setMessage(
      "The login screen is ready. Secure admin authentication will be connected in the next step."
    );
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
        <div className="login-icon">🔐</div>
        <p className="eyebrow">RESTRICTED AREA</p>
        <h1>Welcome back</h1>
        <p className="login-description">
          Sign-in interface for authorised BrainTech Store administrators.
        </p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label htmlFor="admin-email">Email address</label>
          <input
            id="admin-email"
            type="email"
            placeholder="admin@braintechpc.in"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button className="admin-primary-button login-submit" type="submit">
            Continue securely <span>→</span>
          </button>
        </form>

        {message && <p className="login-notice">{message}</p>}

        <div className="login-security-note">
          <span>🛡️</span>
          <p>
            Admin access will be restricted using server-side authentication.
            This screen is currently a UI preview.
          </p>
        </div>
      </section>

      <p className="login-footer">
        © {new Date().getFullYear()} BrainTech Store · Admin access only
      </p>
    </main>
  );
}
