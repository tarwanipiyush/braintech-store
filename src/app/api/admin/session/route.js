
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("braintech_admin_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    const apiBase = process.env.BRAINTECH_API_BASE_URL;

    if (!apiBase) {
      return NextResponse.json(
        { success: false, message: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${apiBase.replace(/\/+$/, "")}/admin-session.php`,
      {
        method: "GET",
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
        "Hostinger session endpoint returned non-JSON:",
        response.status,
        rawResponse.slice(0, 500)
      );

      return NextResponse.json(
        {
          success: false,
          message: "Hostinger returned an invalid session response.",
          hostStatus: response.status,
        },
        { status: 502 }
      );
    }

    if (!response.ok || !data.success || !data.admin) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Session is invalid or expired.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: data.admin,
    });

  } catch (error) {
    console.error("Admin session API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to check admin session.",
      },
      { status: 500 }
    );
  }
}
