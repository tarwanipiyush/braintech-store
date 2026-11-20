
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const { searchParams } = new URL(request.url);

    const requestedPage = searchParams.get("page") || "homepage";

    const allowedPages = ["homepage", "shop", "product"];

    if (!allowedPages.includes(requestedPage)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid banner page.",
        },
        { status: 400 }
      );
    }

    const endpoint = `${API_BASE.replace(/\/+$/, "")}/public-banners.php?page=${encodeURIComponent(requestedPage)}`;

    const response = await fetch(endpoint, {
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
      console.error(
        "Hostinger public banners API returned non-JSON:",
        response.status,
        raw.slice(0, 2000)
      );

      return NextResponse.json(
        {
          success: false,
          message: "Hostinger returned an invalid banners response.",
        },
        { status: 502 }
      );
    }

    if (!response.ok || data.success === false) {
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Store banners API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load homepage banners.",
      },
      { status: 502 }
    );
  }
}
