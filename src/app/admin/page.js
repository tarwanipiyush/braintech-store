
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    "braintech_admin_session"
  )?.value;

  // Require a session cookie.
  if (!token) {
    redirect("/admin/login");
  }

  const apiBase = process.env.BRAINTECH_API_BASE_URL;

  if (!apiBase) {
    console.error(
      "BRAINTECH_API_BASE_URL is not configured."
    );

    redirect("/admin/login");
  }

  try {
    const endpoint =
      `${apiBase.replace(/\/+$/, "")}/admin-session.php`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const rawResponse = await response.text();

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      console.error(
        "Admin session endpoint returned invalid JSON."
      );

      console.error(
        "Response:",
        rawResponse.slice(0, 500)
      );

      redirect("/admin/login");
    }

    // Reject failed HTTP responses or invalid sessions.
    // Do NOT require data.admin because the PHP endpoint
    // currently returns products/categories instead.
    if (!response.ok || data.success !== true) {
      console.error(
        "Admin dashboard session validation failed.",
        {
          status: response.status,
          success: data.success,
          message: data.message || "No message returned",
        }
      );

      redirect("/admin/login");
    }

    // Session is valid.
    console.log(
      "Admin dashboard authentication successful."
    );

    // The current PHP response does not include an admin object.
    // Pass null instead of redirecting because of its absence.
    return (
      <DashboardClient
        admin={data.admin ?? null}
      />
    );

  } catch (error) {
    // Next.js redirect() throws internally.
    // Preserve that redirect instead of swallowing it.
    if (
      error?.digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error(
      "Admin dashboard authentication error:",
      error
    );

    redirect("/admin/login");
  }
}
