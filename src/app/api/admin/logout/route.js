import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("braintech_admin_session")?.value;

  const clearSessionCookie = (response) => {
    response.cookies.set("braintech_admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  };

  if (!token) {
    return clearSessionCookie(
      NextResponse.json({
        success: true,
        message: "Already logged out.",
      })
    );
  }

  const apiBase = process.env.BRAINTECH_API_BASE_URL;

  if (!apiBase) {
    return NextResponse.json(
      {
        success: false,
        message: "Server configuration is incomplete.",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${apiBase.replace(/\/+$/, "")}/admin-logout.php`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const rawResponse = await response.text();

    let data;

    try {
      data = JSON.parse(rawResponse);
    } catch {
      console.error(
        "Hostinger logout returned invalid response:",
        response.status,
        rawResponse.slice(0, 300)
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to confirm logout with the server.",
        },
        { status: 502 }
      );
    }

    if (!response.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Unable to revoke admin session.",
        },
        { status: 502 }
      );
    }

    return clearSessionCookie(
      NextResponse.json({
        success: true,
        message: "Logged out successfully.",
      })
    );

  } catch (error) {
    console.error("Admin logout API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to contact the authentication server.",
      },
      { status: 502 }
    );
  }
}