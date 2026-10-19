"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateQrSvg, buildStableMenuUrl } from "@/lib/qr";
import {
  X,
  Copy,
  Check,
  Share2,
  Download,
  QrCode,
  Flame,
  Utensils,
} from "lucide-react";
import type { GuestLanguage } from "@/lib/menu-helpers";
import styles from "./guest-menu.module.css";

interface GuestShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuTitle: string;
  hotelName: string;
  menuSlug: string;
  menuId?: string;
  qrCodeSvg?: string | null;
  lang?: GuestLanguage;
}

export function GuestShareModal({
  isOpen,
  onClose,
  menuTitle,
  hotelName,
  menuSlug,
  menuId,
  qrCodeSvg,
  lang = "en",
}: GuestShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [stableSvg, setStableSvg] = useState("");

  useEffect(() => {
    if (!isOpen || !menuId) return;
    let active = true;
    generateQrSvg(buildStableMenuUrl(menuId))
      .then((svg) => {
        if (active) setStableSvg(svg);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, menuId]);

  if (!isOpen) return null;

  const currentUrl = menuId
    ? buildStableMenuUrl(menuId)
    : typeof window !== "undefined"
    ? `${window.location.origin}/menu/${menuSlug}`
    : `/menu/${menuSlug}`;

  const activeQrSvg = menuId ? stableSvg : qrCodeSvg || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleDownloadQr = () => {
    if (!activeQrSvg) return;
    try {
      const blob = new Blob([activeQrSvg], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${menuSlug || "hotel-menu"}-qr.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${hotelName} — ${menuTitle}`,
          text: `Explore the digital menu for ${menuTitle} at ${hotelName}`,
          url: currentUrl,
        });
        return;
      } catch {
        // user aborted share
      }
    }
    await handleCopy();
  };

  return (
    <AnimatePresence>
      <div
        className={styles.shareOverlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 18 }}
          className={styles.shareModalCard}
          role="dialog"
          aria-modal="true"
          aria-label="Share Menu & QR Code"
        >
          <button
            type="button"
            onClick={onClose}
            className={styles.shareCloseBtn}
            aria-label="Close share modal"
          >
            <X size={16} />
          </button>

          <div className={styles.shareEmblemBadge}>
            <Utensils size={16} />
            <Flame size={18} />
          </div>

          <span className={styles.shareModalEyebrow}>
            {lang === "am" ? "የዲጂታል ምናሌ QR" : "INSTANT TABLE QR & LINK"}
          </span>
          <h3 className={styles.shareModalTitle}>{hotelName}</h3>
          <p className={styles.shareModalSubtitle}>{menuTitle}</p>

          {/* QR Code Showcase Frame */}
          <div className={styles.shareQrFrame}>
            {activeQrSvg ? (
              <div
                className={styles.shareQrSvgBox}
                dangerouslySetInnerHTML={{ __html: activeQrSvg }}
              />
            ) : (
              <div className={styles.shareQrLoading}>
                <QrCode size={28} />
                <span>
                  {lang === "am"
                    ? "QR ኮድ በማዘጋጀት ላይ..."
                    : "Generating QR code..."}
                </span>
              </div>
            )}
          </div>

          <p className={styles.shareScanHint}>
            {lang === "am"
              ? "በማንኛውም ስልክ ካሜራ ይህን QR በመቃኘት ምናሌውን ወዲያውኑ ይክፈቱ።"
              : "Point any phone camera here to open this menu instantly."}
          </p>

          <div className={styles.shareUrlPreview}>
            <span>{currentUrl}</span>
          </div>

          {/* Primary & Secondary Action Buttons */}
          <div className={styles.shareActionsStack}>
            <button
              type="button"
              onClick={handleCopy}
              className={styles.sharePrimaryBtn}
            >
              {copied ? (
                <>
                  <Check size={15} />
                  <span>
                    {lang === "am"
                      ? "ሊንኩ ተቀድቷል!"
                      : "Menu Link Copied!"}
                  </span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  <span>
                    {lang === "am"
                      ? "የምናሌ ሊንክ ቅዳ (Copy Link)"
                      : "Copy Public Menu Link"}
                  </span>
                </>
              )}
            </button>

            <div className={styles.shareSecondaryRow}>
              <button
                type="button"
                onClick={handleNativeShare}
                className={styles.shareSecondaryBtn}
              >
                <Share2 size={14} />
                <span>{lang === "am" ? "ለጓደኛ አጋራ" : "Share Menu"}</span>
              </button>

              {activeQrSvg && (
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className={styles.shareSecondaryBtn}
                >
                  <Download size={14} />
                  <span>{lang === "am" ? "QR አውርድ" : "Save QR SVG"}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

