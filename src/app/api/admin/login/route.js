
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const apiBase = process.env.BRAINTECH_API_BASE_URL;

    if (!apiBase) {
      console.error("BRAINTECH_API_BASE_URL is missing.");

      return NextResponse.json(
        {
          success: false,
          message: "Login service configuration is missing.",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${apiBase.replace(/\/$/, "")}/admin-login.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      }
    );

    const rawResponse = await response.text();

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      console.error(
        "Hostinger returned a non-JSON response.",
        "HTTP status:",
        response.status,
        "Response:",
        rawResponse.slice(0, 1500)
      );

      return NextResponse.json(
        {
          success: false,
          message: `Login server returned an invalid response (HTTP ${response.status}). Check the Next.js terminal for details.`,
        },
        { status: 502 }
      );
    }

    console.log("Hostinger login response status:", response.status);

    return NextResponse.json(data, {
      status: response.status,
    });

  } catch (error) {
    console.error("Admin login API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to the login service. Check the Next.js terminal.",
      },
      { status: 500 }
    );
  }
}
