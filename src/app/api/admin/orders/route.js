
import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.BRAINTECH_API_BASE_URL ||
  "https://skilllynxedubridge.com/api/braintech";

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin authentication required. Please log in again.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const query = searchParams.toString();

    const response = await fetch(
      `${API_BASE_URL}/admin-orders.php${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: {
          Authorization: authorization,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Admin Orders GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load orders from backend.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin authentication required. Please log in again.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(
      `${API_BASE_URL}/admin-orders.php`,
      {
        method: "PUT",
        headers: {
          Authorization: authorization,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Admin Orders PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update order status.",
      },
      { status: 500 }
    );
  }
}
