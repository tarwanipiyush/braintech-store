"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedDestination = searchParams.get("next");

  const destination =
    requestedDestination &&
    requestedDestination.startsWith("/") &&
    !requestedDestination.startsWith("//") &&
    !requestedDestination.startsWith("/\\")
      ? requestedDestination
      : "/";

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

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
      maxWidth: "460px",
      padding: "34px 36px",
      boxSizing: "border-box",
      border: "1px solid #e5e9f2",
      borderRadius: "20px",
      background: "#ffffff",
      boxShadow: "0 18px 55px rgba(31, 41, 55, 0.09)",
    },
    brand: {
      display: "block",
      marginBottom: "24px",
      color: "#e53945",
      fontSize: "29px",
      fontWeight: "800",
      textAlign: "center",
      textDecoration: "none",
      letterSpacing: "-1px",
    },
    title: {
      margin: "0 0 10px",
      color: "#172033",
      fontSize: "28px",
      fontWeight: "750",
      textAlign: "center",
      letterSpacing: "-0.7px",
    },
    subtitle: {
      margin: "0 0 25px",
      color: "#687386",
      fontSize: "14px",
      lineHeight: "1.7",
      textAlign: "center",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      color: "#273449",
      fontSize: "14px",
      fontWeight: "650",
    },
    input: {
      width: "100%",
      height: "47px",
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
      padding: "10px",
      border: "1px solid #f4cbd0",
      borderRadius: "8px",
      background: "#fff0f1",
      color: "#c92f3b",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "700",
    },
    submit: {
      width: "100%",
      minHeight: "49px",
      marginTop: "4px",
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
    link: {
      color: "#d93240",
      fontWeight: "600",
      textDecoration: "none",
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
      margin: "23px 0 0",
      color: "#687386",
      fontSize: "14px",
      lineHeight: "1.8",
      textAlign: "center",
    },
    backLink: {
      display: "block",
      marginTop: "19px",
      color: "#687386",
      fontSize: "13px",
      textAlign: "center",
      textDecoration: "none",
    },
  };

  function handleInputFocus(event) {
    event.currentTarget.style.borderColor = "#e53945";
    event.currentTarget.style.boxShadow =
      "0 0 0 3px rgba(229,57,69,0.10)";
  }

  function handleInputBlur(event) {
    event.currentTarget.style.borderColor = "#d8deea";
    event.currentTarget.style.boxShadow = "none";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(
      formData.get("confirmPassword") || ""
    );

    if (!name) {
      setMessage("Please enter your full name.");
      setMessageType("error");
      return;
    }

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match. Please try again.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(destination)}`,
        },
      });

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        return;
      }

      if (data.session) {
        setMessage("Your account has been created successfully!");
        setMessageType("success");

        router.replace(destination);
        router.refresh();
        return;
      }

      setMessage(
        "Your account was created successfully. Please check your email for the confirmation link before signing in."
      );
      setMessageType("success");
      form.reset();
    } catch {
      setMessage(
        "Unable to create your account. Check your connection and Supabase configuration."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
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
              maxLength={100}
              required
              style={styles.input}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
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
              maxLength={254}
              required
              style={styles.input}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
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
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />

              <button
                type="button"
                style={styles.showPassword}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide passwords" : "Show passwords"}
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
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          {message && (
            <p role="status" aria-live="polite" style={styles.message}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submit,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
            onMouseEnter={(event) => {
              if (!loading) {
                event.currentTarget.style.background = "#c92f3b";
                event.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "#e53945";
              event.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.bottomText}>
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(destination)}`}
            style={styles.link}
          >
            Sign in
          </Link>
        </p>

        <Link href="/" style={styles.backLink}>
          &larr; Back to store
        </Link>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f7fb",
            color: "#172033",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          Loading registration form...
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}