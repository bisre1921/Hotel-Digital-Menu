import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { saveUploadedFile, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    // Require authenticated hotel user
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mimeType = file.type;
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `Unsupported media format: ${mimeType}` },
        { status: 400 }
      );
    }

    // Limit image size to 15MB, video to 60MB
    const maxSize = isVideo ? 60 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${isVideo ? "60MB" : "15MB"}.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const saved = await saveUploadedFile(buffer, file.name, mimeType);

    return NextResponse.json({
      success: true,
      url: saved.url,
      filename: saved.filename,
      mimeType: saved.mimeType,
      type: isVideo ? "video" : "image",
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
