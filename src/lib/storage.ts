import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Supported MIME types
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export async function ensureUploadsDir(): Promise<void> {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export async function saveUploadedFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ url: string; filename: string; mimeType: string }> {
  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

  if (!isImage && !isVideo) {
    throw new Error(`Unsupported media format: ${mimeType}`);
  }

  // 1. If Cloudinary is configured, we could upload there
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
      formData.append("file", blob);
      formData.append("upload_preset", "hotel_menu");

      const resourceType = isVideo ? "video" : "image";
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (res.ok) {
        const json = await res.json();
        return {
          url: json.secure_url,
          filename: json.public_id,
          mimeType,
        };
      }
    } catch (err) {
      console.warn("Cloudinary upload failed, falling back to local storage:", err);
    }
  }

  // 2. High-performance local media storage
  await ensureUploadsDir();

  const extension = path.extname(filename) || (isImage ? ".jpg" : ".mp4");
  const randomId = crypto.randomBytes(16).toString("hex");
  const uniqueFilename = `${Date.now()}-${randomId}${extension}`;
  const filePath = path.join(UPLOADS_DIR, uniqueFilename);

  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${uniqueFilename}`,
    filename: uniqueFilename,
    mimeType,
  };
}
