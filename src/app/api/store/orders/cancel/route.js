
import { NextResponse } from "next/server";

const API_BASE = process.env.BRAINTECH_API_BASE_URL;

const PHP_ENDPOINT = API_BASE
  ? `${API_BASE.replace(/\/+$/, "")}/customer-cancel-order.php`
  : null;

export async function POST(request) {
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

    if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Please sign in before cancelling an order.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.orderNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Order number is required.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(PHP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        orderNumber: body.orderNumber,
      }),
      cache: "no-store",
    });

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Hostinger invalid cancellation response:", {
        status: response.status,
        response: raw.slice(0, 1500),
      });

      return NextResponse.json(
        {
          success: false,
          message: "Hostinger returned an invalid cancellation response.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Customer cancellation API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to the cancellation service.",
      },
      { status: 502 }
    );
  }
}
