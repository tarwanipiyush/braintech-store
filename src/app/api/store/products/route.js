
import { NextResponse } from "next/server";

const API_BASE = process.env.BRAINTECH_API_BASE_URL;

const PHP_ENDPOINT = API_BASE
  ? `${API_BASE.replace(/\/+$/, "")}/public-products.php`
  : null;

export async function GET() {
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

    const response = await fetch(PHP_ENDPOINT, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Hostinger invalid JSON response:", {
        status: response.status,
        endpoint: PHP_ENDPOINT,
        response: raw.slice(0, 1500),
      });

      return NextResponse.json(
        {
          success: false,
          message: "Hostinger returned an invalid products response.",
          hostinger_status: response.status,
          hostinger_response: raw.slice(0, 1500),
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Storefront products API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to Hostinger.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
