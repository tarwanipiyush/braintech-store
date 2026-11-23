
import { NextResponse } from "next/server";

const API_BASE = process.env.BRAINTECH_API_BASE_URL;

export async function GET(request) {
  try {
    if (!API_BASE) {
      return NextResponse.json(
        {
          success: false,
          message: "Hostinger API configuration is missing.",
        },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Please sign in to view your orders.",
        },
        { status: 401 }
      );
    }

    const endpoint = `${API_BASE.replace(/\/+$/, "")}/customer-orders.php`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
      cache: "no-store",
    });

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Hostinger invalid customer orders response:", {
        status: response.status,
        response: raw.slice(0, 1500),
      });

      return NextResponse.json(
        {
          success: false,
          message: "Hostinger returned an invalid orders response.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Customer orders API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to the orders service.",
      },
      { status: 502 }
    );
  }
}
