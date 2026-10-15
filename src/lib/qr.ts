import QRCode from "qrcode";

export interface QROptions {
  darkColor?: string;
  lightColor?: string;
  width?: number;
  margin?: number;
}

export async function generateQrSvg(
  url: string,
  options: QROptions = {}
): Promise<string> {
  const {
    darkColor = "#131418",
    lightColor = "#FFFFFF",
    width = 380,
    margin = 2,
  } = options;

  return QRCode.toString(url, {
    type: "svg",
    color: {
      dark: darkColor,
      light: lightColor,
    },
    margin,
    width,
  });
}

export async function generateQrPngDataUrl(
  url: string,
  options: QROptions = {}
): Promise<string> {
  const {
    darkColor = "#131418",
    lightColor = "#FFFFFF",
    width = 600,
    margin = 2,
  } = options;

  return QRCode.toDataURL(url, {
    color: {
      dark: darkColor,
      light: lightColor,
    },
    margin,
    width,
  });
}

export function buildPublicMenuUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/menu/${slug}`;
}

/** Menu identity survives title/slug changes. Printed codes must use this URL. */
export function buildStableMenuUrl(id: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/q/${encodeURIComponent(id)}`;
}
