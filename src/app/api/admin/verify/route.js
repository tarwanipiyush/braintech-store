
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "POST required.",
    },
    { status: 405 }
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const otp = String(body.otp || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter your email and six-digit OTP.",
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
          message: "Server configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    const endpoint =
      `${apiBase.replace(/\/+$/, "")}/verify-admin-otp.php`;

    console.log("Calling admin OTP endpoint:", endpoint);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        otp,
      }),
      cache: "no-store",
    });

    const rawResponse = await response.text();

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      console.error(
        "Hostinger OTP endpoint returned non-JSON:",
        response.status,
        rawResponse.slice(0, 1000)
      );

      return NextResponse.json(
        {
          success: false,
          message: `OTP server returned an invalid response (HTTP ${response.status}).`,
        },
        { status: 502 }
      );
    }

    if (!response.ok || !data.success || !data.token) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "OTP verification failed.",
        },
        {
          status: response.ok ? 401 : response.status,
        }
      );
    }

    // Return the token because the existing frontend login page
    // expects data.token and saves it in localStorage.
    const result = NextResponse.json({
      success: true,
      message: "You have logged in successfully.",
      token: data.token,
      admin: data.admin,
    });

    // Also keep the HTTP-only cookie for server-side use.
    result.cookies.set(
      "braintech_admin_session",
      data.token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 8 * 60 * 60,
      }
    );

    return result;
  } catch (error) {
    console.error("Admin OTP API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify OTP. Check the Next.js terminal.",
      },
      { status: 500 }
    );
  }
}
