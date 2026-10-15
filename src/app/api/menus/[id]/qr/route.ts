import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateQrPngDataUrl, generateQrSvg, buildStableMenuUrl } from "@/lib/qr";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "svg"; // "svg" | "png"
    const darkColor = searchParams.get("dark") || "#131418";
    const lightColor = searchParams.get("light") || "#FFFFFF";
    const download = searchParams.get("download") === "true";

    const menu = await db.menu.findUnique({
      where: { id: params.id },
      include: { hotel: true },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const publicUrl = buildStableMenuUrl(menu.id);

    if (format === "png") {
      const dataUrl = await generateQrPngDataUrl(publicUrl, {
        darkColor,
        lightColor,
        width: 800,
      });

      if (download) {
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="${menu.slug}-qr.png"`,
          },
        });
      }

      return NextResponse.json({ dataUrl, publicUrl });
    }

    // Default SVG
    const svg = await generateQrSvg(publicUrl, {
      darkColor,
      lightColor,
      width: 400,
    });

    if (download) {
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="${menu.slug}-qr.svg"`,
        },
      });
    }

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
      },
    });
  } catch (error) {
    console.error("QR export error:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
