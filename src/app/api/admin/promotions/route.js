
import { NextResponse } from "next/server";

const API_BASE = process.env.BRAINTECH_API_BASE_URL;

const PHP_ENDPOINT = API_BASE
  ? `${API_BASE.replace(/\/+$/, "")}/admin-promotions.php`
  : null;

async function forwardToHostinger(request, method) {
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

    if (
      !authorization ||
      !/^Bearer\s+[a-f0-9]{64}$/i.test(authorization)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required. Please log in again.",
        },
        { status: 401 }
      );
    }

    const options = {
      method,
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    };

    if (method !== "GET") {
      options.body = await request.text();
    }

    const response = await fetch(PHP_ENDPOINT, options);
    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      console.error(
        "Hostinger promotions API returned non-JSON:",
        response.status,
        raw.slice(0, 2000)
      );

      return NextResponse.json(
        {
          success: false,
          message: "Hostinger returned a non-JSON response.",
          hostinger_status: response.status,
          hostinger_response: raw.slice(0, 2000),
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("BrainTech promotions proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to the Hostinger promotions API.",
      },
      { status: 502 }
    );
  }
}

export async function GET(request) {
  return forwardToHostinger(request, "GET");
}

export async function POST(request) {
  return forwardToHostinger(request, "POST");
}

export async function PUT(request) {
  return forwardToHostinger(request, "PUT");
}

export async function DELETE(request) {
  return forwardToHostinger(request, "DELETE");
}
