"use client";

import React, { useState, useEffect } from "react";
import { Download, Copy, Check, ExternalLink, QrCode, Sparkles, Printer } from "lucide-react";
import { generateQrSvg } from "@/lib/qr";

interface QRStudioProps {
  menuId: string;
  menuTitle: string;
  menuSlug: string;
  hotelName: string;
  hotelPrimaryColor?: string | null;
}

export function QRStudio({
  menuId,
  menuTitle,
  menuSlug,
  hotelName,
  hotelPrimaryColor = "#131418",
}: QRStudioProps) {
  const [darkColor, setDarkColor] = useState(hotelPrimaryColor || "#131418");
  const [lightColor, setLightColor] = useState("#FFFFFF");
  const [svgString, setSvgString] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"png" | "svg" | null>(null);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${menuSlug}`
      : `/menu/${menuSlug}`;

  useEffect(() => {
    let active = true;
    generateQrSvg(publicUrl, { darkColor, lightColor, width: 400 })
      .then((svg) => {
        if (active) setSvgString(svg);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [publicUrl, darkColor, lightColor]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: "png" | "svg") => {
    setDownloading(format);
    const downloadUrl = `/api/menus/${menuId}/qr?format=${format}&dark=${encodeURIComponent(
      darkColor
    )}&light=${encodeURIComponent(lightColor)}&download=true`;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${menuSlug}-qr.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => setDownloading(null), 1000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Visual QR Code Display */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="p-8 rounded-3xl bg-card border border-border shadow-luxury flex flex-col items-center w-full max-w-sm">
          <div className="text-center mb-5">
            <span className="text-[11px] uppercase tracking-widest text-gold-500 font-semibold block">
              {hotelName}
            </span>
            <h4 className="font-serif text-lg font-medium text-foreground">{menuTitle}</h4>
          </div>

          {/* Rendered SVG */}
          <div
            className="w-64 h-64 p-4 rounded-2xl shadow-inner flex items-center justify-center transition-colors"
            style={{ backgroundColor: lightColor }}
          >
            {svgString ? (
              <div
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: svgString }}
              />
            ) : (
              <div className="text-xs text-muted-foreground animate-pulse">
                Rendering vector QR...
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <span className="text-[11px] text-muted-foreground font-mono">
              /menu/{menuSlug}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration & Downloads */}
      <div className="lg:col-span-7 space-y-6">
        <div className="p-6 rounded-3xl bg-card border border-border shadow-subtle space-y-6">
          <div>
            <h3 className="font-serif text-xl font-medium text-foreground">
              Branded QR Code Studio
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-light">
              Customize brand colors, download high-definition assets for table stands, or copy the direct public URL.
            </p>
          </div>

          {/* Color Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                QR Foreground Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-border"
                />
                <input
                  type="text"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs uppercase font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-border"
                />
                <input
                  type="text"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs uppercase font-mono"
                />
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="pt-4 border-t border-border/60 space-y-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Export Print Materials
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDownload("png")}
                disabled={downloading === "png"}
                className="py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                {downloading === "png" ? "Preparing PNG..." : "Download High-Res PNG"}
              </button>

              <button
                type="button"
                onClick={() => handleDownload("svg")}
                disabled={downloading === "svg"}
                className="py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border border-border/80 bg-secondary/50 hover:bg-secondary text-foreground flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                {downloading === "svg" ? "Preparing SVG..." : "Download Vector SVG"}
              </button>
            </div>
          </div>

          {/* Share & Test URL */}
          <div className="pt-4 border-t border-border/60 space-y-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Public Menu Access Link
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground font-mono"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider bg-secondary hover:bg-gold-500 hover:text-black border border-border flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={`${publicUrl}?source=qr`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border border-border hover:bg-secondary text-foreground flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Test Scan
              </a>
            </div>
          </div>
        </div>

        {/* Hospitality Best Practices Card */}
        <div className="p-5 rounded-2xl bg-secondary/30 border border-border flex items-start gap-3">
          <Printer className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground block">
              Hotel Printing Guidelines
            </span>
            <p>
              For dining tables, room service acrylic tents, and cocktail coasters, print at a minimum of 4cm &times; 4cm with high contrast for swift scanning in ambient candlelight. Vector SVG is ideal for large banners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
