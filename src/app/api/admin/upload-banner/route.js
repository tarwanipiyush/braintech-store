
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const token = request.headers.get("authorization");

    if (!token || !token.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin authorization missing.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!image || typeof image === "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Banner image file missing.",
        },
        { status: 400 }
      );
    }

    const apiBase = process.env.BRAINTECH_API_BASE_URL;

    if (!apiBase) {
      return NextResponse.json(
        {
          success: false,
          message: "Hostinger API URL missing.",
        },
        { status: 500 }
      );
    }

    const uploadForm = new FormData();
    uploadForm.append("image", image, image.name);

    const response = await fetch(
      `${apiBase.replace(/\/+$/, "")}/admin-upload-banner.php`,
      {
        method: "POST",
        headers: {
          Authorization: token,
        },
        body: uploadForm,
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    console.log("HOSTINGER BANNER UPLOAD STATUS:", response.status);
    console.log("HOSTINGER BANNER UPLOAD RESPONSE:", responseText);

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Hostinger returned invalid JSON.",
          hostingerStatus: response.status,
          hostingerResponse: responseText.slice(0, 3000),
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("BANNER UPLOAD ROUTE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Banner upload request failed.",
      },
      { status: 500 }
    );
  }
}
