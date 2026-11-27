import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();

    const code = String(body.code || "").trim();
    const subtotal = Number(body.subtotal);

    if (!code || !Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json(
        { success: false, message: "Invalid coupon details." },
        { status: 400 }
      );
    }

    const apiBase = process.env.BRAINTECH_API_BASE_URL;

    if (!apiBase) {
      throw new Error("BRAINTECH_API_BASE_URL is not configured.");
    }

    const response = await fetch(
      `${apiBase.replace(/\/+$/, "")}/validate-coupon.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ code, subtotal }),
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error("Coupon API returned an invalid response.");
    }

    return NextResponse.json(result, {
      status: response.ok ? 200 : response.status,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to validate coupon.",
      },
      { status: 500 }
    );
  }
}