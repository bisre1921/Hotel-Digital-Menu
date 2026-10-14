"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Upload, Copy, Check, Video, Image as ImageIcon, Filter, ExternalLink } from "lucide-react";

interface MediaItem {
  url: string;
  title: string;
  type: "image" | "video";
  context: string;
}

interface MediaClientProps {
  initialMedia: MediaItem[];
}

export function MediaClient({ initialMedia }: MediaClientProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (res.ok) {
        setMedia([
          {
            url: json.url,
            title: file.name,
            type: json.type,
            context: "Direct Upload",
          },
          ...media,
        ]);
      } else {
        alert(json.error || "Upload failed");
      }
    } catch {
      alert("Failed to upload media");
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredMedia = media.filter((m) => {
    if (filter === "all") return true;
    return m.type === filter;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold-500 font-semibold mb-1">
            Visual Assets & Culinary Media
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Media Library
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light">
            Upload, preview, and manage food and drink photography and video reels for your digital menus.
          </p>
        </div>

        <label className="cursor-pointer py-2.5 px-5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 flex items-center justify-center gap-2 transition-all shrink-0">
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading Media..." : "Upload New Media"}
          <input
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: "all", label: "All Media", count: media.length },
          { id: "image", label: "Images", count: media.filter((m) => m.type === "image").length },
          { id: "video", label: "Videos", count: media.filter((m) => m.type === "video").length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`py-2 px-3.5 rounded-xl text-xs font-medium border transition-all ${
              filter === f.id
                ? "bg-foreground text-background border-foreground font-semibold"
                : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMedia.map((item, idx) => (
          <div
            key={idx}
            className="group rounded-2xl bg-card border border-border/80 hover:border-gold-500/50 overflow-hidden shadow-subtle flex flex-col justify-between transition-all"
          >
            <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
              {item.type === "video" ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video src={item.url} className="w-full h-full object-cover" controls={false} />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <Video className="w-8 h-8 text-white/80" />
                  </div>
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}

              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] uppercase font-semibold">
                {item.context}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <h4 className="text-xs font-semibold text-foreground truncate">{item.title}</h4>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => copyUrl(item.url)}
                  className="text-[11px] font-medium text-gold-500 hover:text-gold-400 flex items-center gap-1"
                >
                  {copiedUrl === item.url ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied URL
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy URL
                    </>
                  )}
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-muted-foreground hover:text-foreground"
                  title="Open full resolution"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
