
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "28px 18px",
      boxSizing: "border-box",
      background: "#f5f7fb",
      color: "#172033",
      fontFamily: "Arial, Helvetica, sans-serif",
    },
    card: {
      width: "100%",
      maxWidth: "440px",
      padding: "38px",
      boxSizing: "border-box",
      border: "1px solid #e5e9f2",
      borderRadius: "20px",
      background: "#ffffff",
      boxShadow: "0 18px 55px rgba(31, 41, 55, 0.09)",
    },
    brand: {
      display: "inline-block",
      marginBottom: "30px",
      color: "#e53945",
      fontSize: "29px",
      fontWeight: "800",
      letterSpacing: "-1px",
      textDecoration: "none",
    },
    brandRow: {
      textAlign: "center",
    },
    title: {
      margin: "0 0 10px",
      color: "#172033",
      fontSize: "30px",
      fontWeight: "750",
      textAlign: "center",
      letterSpacing: "-0.7px",
    },
    subtitle: {
      margin: "0 0 30px",
      color: "#687386",
      fontSize: "14px",
      lineHeight: "1.7",
      textAlign: "center",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "19px",
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "9px",
    },
    label: {
      color: "#273449",
      fontSize: "14px",
      fontWeight: "650",
    },
    input: {
      width: "100%",
      height: "49px",
      padding: "0 14px",
      boxSizing: "border-box",
      border: "1px solid #d8deea",
      borderRadius: "10px",
      outline: "none",
      background: "#ffffff",
      color: "#172033",
      fontSize: "14px",
      transition: "border-color 0.2s, box-shadow 0.2s",
    },
    passwordRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    showPassword: {
      flexShrink: 0,
      padding: "10px 8px",
      border: "none",
      borderRadius: "7px",
      background: "#fff0f1",
      color: "#c92f3b",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "700",
    },
    options: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "12px",
      color: "#586579",
      fontSize: "13px",
    },
    remember: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
    },
    checkbox: {
      width: "15px",
      height: "15px",
      accentColor: "#e53945",
      cursor: "pointer",
    },
    link: {
      color: "#d93240",
      fontWeight: "600",
      textDecoration: "none",
    },
    submit: {
      width: "100%",
      minHeight: "50px",
      marginTop: "3px",
      border: "1px solid #e53945",
      borderRadius: "10px",
      background: "#e53945",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow: "0 5px 14px rgba(229, 57, 69, 0.17)",
      transition: "background 0.2s, transform 0.2s",
    },
    message: {
      margin: 0,
      padding: "12px 13px",
      border: `1px solid ${
        messageType === "success" ? "#b7e4c7" : "#fecaca"
      }`,
      borderRadius: "9px",
      background: messageType === "success" ? "#f0fdf4" : "#fff1f2",
      color: messageType === "success" ? "#166534" : "#b42332",
      fontSize: "13px",
      lineHeight: "1.6",
    },
    bottomText: {
      margin: "25px 0 0",
      color: "#687386",
      fontSize: "14px",
      lineHeight: "1.8",
      textAlign: "center",
    },
    backLink: {
      display: "block",
      marginTop: "23px",
      color: "#687386",
      fontSize: "13px",
      textAlign: "center",
      textDecoration: "none",
    },
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(
          error.message === "Invalid login credentials"
            ? "Email or password is incorrect. Please try again."
            : error.message
        );
        setMessageType("error");
        return;
      }

      setMessageType("success");
setMessage("Login successful! Redirecting...");

const params = new URLSearchParams(window.location.search);
const requestedDestination = params.get("next");

const destination =
  requestedDestination &&
  requestedDestination.startsWith("/") &&
  !requestedDestination.startsWith("//") &&
  !requestedDestination.startsWith("/\\")
    ? requestedDestination
    : "/";

router.replace(destination);
router.refresh();
    } catch {
      setMessage(
        "Unable to sign in. Please check your connection and Supabase configuration."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brandRow}>
          <Link href="/" style={styles.brand}>
            BrainTech
          </Link>
        </div>

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
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#e53945";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(229,57,69,0.10)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d8deea";
                e.currentTarget.style.boxShadow = "none";
              }}
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
                style={styles.input}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#e53945";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(229,57,69,0.10)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d8deea";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              <button
                type="button"
                style={styles.showPassword}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={styles.checkbox}
              />
              Remember me
            </label>

            <Link href="/forgot-password" style={styles.link}>
              Forgot password?
            </Link>
          </div>

          {message && (
            <p role="alert" aria-live="polite" style={styles.message}>
              {message}
            </p>
          )}

          <button
            type="submit"
            style={{
              ...styles.submit,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#c92f3b";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#e53945";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

      <p style={styles.bottomText}>
  New to BrainTech?{" "}
  <Link
    href="/register"
    style={styles.link}
  >
    Create an account
  </Link>
</p>

<Link href="/" style={styles.backLink}>
  &larr; Back to store
</Link>
</section>
</main>
);
}
