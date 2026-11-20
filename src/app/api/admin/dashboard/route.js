
import { NextResponse } from "next/server";

const API_BASE = process.env.BRAINTECH_API_BASE_URL;

const PHP_ENDPOINT = API_BASE
  ? `${API_BASE.replace(/\/+$/, "")}/admin-dashboard.php`
  : null;

export async function GET(request) {
  try {
    if (!PHP_ENDPOINT) {
      return NextResponse.json(
        {
          success: false,
          message: "Hostinger API configuration is missing.",
        },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const requestUrl = new URL(PHP_ENDPOINT);

const period = new URL(request.url).searchParams.get("period");

if (["7days", "30days", "12months"].includes(period)) {
  requestUrl.searchParams.set("period", period);
}

const response = await fetch(requestUrl.toString(), {
  method: "GET",
  headers: {
    Authorization: authorization,
    Accept: "application/json",
  },
  cache: "no-store",
});

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Dashboard API returned invalid JSON:", {
        status: response.status,
        response: raw.slice(0, 1000),
      });

      return NextResponse.json(
        {
          success: false,
          message: "Hostinger returned an invalid dashboard response.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to Hostinger.",
      },
      { status: 502 }
    );
  }
}
