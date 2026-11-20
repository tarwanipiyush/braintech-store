
import { NextResponse } from "next/server";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow login and authentication API routes.
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/")
  ) {
    return NextResponse.next();
  }

  // Protect admin pages.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Read session cookie.
  const token = request.cookies.get(
    "braintech_admin_session"
  )?.value;

  console.log("========== BRAINTECH ADMIN AUTH ==========");
  console.log("Requested path:", pathname);
  console.log("Session cookie exists:", Boolean(token));
  console.log("Session cookie length:", token?.length || 0);

  function loginRedirect() {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  if (!token) {
    console.error("Admin session cookie missing.");
    return loginRedirect();
  }

  const apiBase = process.env.BRAINTECH_API_BASE_URL;

  if (!apiBase) {
    console.error("BRAINTECH_API_BASE_URL is missing.");
    return loginRedirect();
  }

  try {
    const endpoint =
      `${apiBase.replace(/\/+$/, "")}/admin-session.php`;

    console.log("Checking PHP session endpoint:", endpoint);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const rawResponse = await response.text();

    console.log(
      "Admin session endpoint status:",
      response.status
    );

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      console.error("PHP returned invalid JSON.");
      console.error("Response:", rawResponse.slice(0, 500));

      return loginRedirect();
    }

    console.log("PHP success:", data.success);
    console.log("PHP message:", data.message || "No message");

    // Reject only failed HTTP responses or failed session validation.
    if (!response.ok || data.success !== true) {
      console.error("ADMIN SESSION VALIDATION FAILED");

      return loginRedirect();
    }

    // Session accepted.
    console.log("ADMIN SESSION VALIDATION PASSED");

    return NextResponse.next();

  } catch (error) {
    console.error("Admin proxy authentication error:", error);

    return loginRedirect();
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
