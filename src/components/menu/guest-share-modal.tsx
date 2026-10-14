"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Share2, Download, QrCode } from "lucide-react";

interface GuestShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuTitle: string;
  hotelName: string;
  menuSlug: string;
  qrCodeSvg?: string | null;
}

export function GuestShareModal({
  isOpen,
  onClose,
  menuTitle,
  hotelName,
  menuSlug,
  qrCodeSvg,
}: GuestShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu/${menuSlug}`
      : `/menu/${menuSlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${hotelName} - ${menuTitle}`,
          text: `Explore the digital menu for ${menuTitle} at ${hotelName}`,
          url: currentUrl,
        });
      } catch (e) {
        // user aborted share
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-luxury z-10 text-center"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-full bg-gold-500/10 text-gold-400 mx-auto flex items-center justify-center mb-3">
            <QrCode className="w-6 h-6" />
          </div>

          <h3 className="font-serif text-xl font-medium text-foreground">{menuTitle}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{hotelName}</p>

          {/* QR Code Container */}
          <div className="mt-5 p-4 bg-white rounded-2xl mx-auto w-52 h-52 flex items-center justify-center shadow-inner">
            {qrCodeSvg ? (
              <div
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
              />
            ) : (
              <div className="text-xs text-black/60 font-sans">Generating QR code...</div>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground mt-3">
            Scan to instantly view on any mobile device.
          </p>

          {/* Actions */}
          <div className="mt-5 space-y-2">
            <button
              onClick={handleCopy}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-primary text-black hover:opacity-95 transition-opacity"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Link Copied to Clipboard
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Public Menu Link
                </>
              )}
            </button>

            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-border bg-secondary/50 hover:bg-secondary text-foreground transition-colors"
              >
                <Share2 className="w-4 h-4" /> Share Menu
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
