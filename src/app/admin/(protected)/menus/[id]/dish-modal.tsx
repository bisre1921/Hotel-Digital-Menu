"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Video, Sparkles, Check, AlertCircle } from "lucide-react";
import { DIETARY_OPTIONS, ALLERGEN_OPTIONS } from "@/config/theme";

export interface DishFormData {
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isAvailable: boolean;
  isChefSpecial: boolean;
  isFeatured: boolean;
  calories?: number | null;
  prepTimeMinutes?: number | null;
  dietaryTags: string[];
  allergens: string[];
}

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DishFormData) => Promise<void>;
  categoryId: string;
  initialData?: (DishFormData & { id?: string }) | null;
  currencySymbol: string;
}

export function DishModal({
  isOpen,
  onClose,
  onSave,
  categoryId,
  initialData,
  currencySymbol,
}: DishModalProps) {
  const [formData, setFormData] = useState<DishFormData>({
    categoryId,
    name: "",
    description: "",
    price: 0,
    discountPrice: null,
    imageUrl: "",
    videoUrl: "",
    isAvailable: true,
    isChefSpecial: false,
    isFeatured: false,
    calories: null,
    prepTimeMinutes: null,
    dietaryTags: [],
    allergens: [],
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        categoryId: initialData.categoryId || categoryId,
        description: initialData.description || "",
        imageUrl: initialData.imageUrl || "",
        videoUrl: initialData.videoUrl || "",
        discountPrice: initialData.discountPrice || null,
        calories: initialData.calories || null,
        prepTimeMinutes: initialData.prepTimeMinutes || null,
        dietaryTags: initialData.dietaryTags || [],
        allergens: initialData.allergens || [],
      });
    } else {
      setFormData({
        categoryId,
        name: "",
        description: "",
        price: 25.0,
        discountPrice: null,
        imageUrl: "",
        videoUrl: "",
        isAvailable: true,
        isChefSpecial: false,
        isFeatured: false,
        calories: null,
        prepTimeMinutes: 15,
        dietaryTags: [],
        allergens: [],
      });
    }
  }, [initialData, categoryId, isOpen]);

  if (!isOpen) return null;

  const handleMediaUpload = async (file: File, isVideo: boolean) => {
    if (isVideo) setUploadingVideo(true);
    else setUploadingImage(true);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (res.ok) {
        if (isVideo) {
          setFormData((prev) => ({ ...prev, videoUrl: json.url }));
        } else {
          setFormData((prev) => ({ ...prev, imageUrl: json.url }));
        }
      } else {
        alert(json.error || "Upload failed");
      }
    } catch {
      alert("Media upload failed");
    } finally {
      if (isVideo) setUploadingVideo(false);
      else setUploadingImage(false);
    }
  };

  const toggleDietary = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(val)
        ? prev.dietaryTags.filter((t) => t !== val)
        : [...prev.dietaryTags, val],
    }));
  };

  const toggleAllergen = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(val)
        ? prev.allergens.filter((a) => a !== val)
        : [...prev.allergens, val],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...formData,
        categoryId: formData.categoryId || categoryId,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        calories: formData.calories ? Number(formData.calories) : null,
        prepTimeMinutes: formData.prepTimeMinutes ? Number(formData.prepTimeMinutes) : null,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to save dish");
    } finally {
      setSaving(false);
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
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-luxury z-10 no-scrollbar"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="font-serif text-2xl font-medium text-foreground">
            {initialData ? "Edit Culinary Dish" : "Add New Dish"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Specify dish name, pricing, photos, video presentations, allergens, and dietary credentials.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Dish Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Dish Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Pan-Seared Hokkaido Scallops"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            {/* Pricing Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Price ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Special Offer Price (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountPrice ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPrice: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="e.g. 19.50"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Description & Ingredients
              </label>
              <textarea
                rows={3}
                value={formData.description ?? ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Craftsmanship details, provenance of ingredients, pairing notes..."
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            {/* Photo & Video Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photo */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dish Photography
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={formData.imageUrl ?? ""}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="URL or Upload"
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
                  />
                  <label className="cursor-pointer py-2 px-3 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0], false)}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {uploadingImage && <div className="text-[11px] text-gold-500">Uploading photo...</div>}
                {formData.imageUrl && (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden bg-muted border border-border">
                    <Image src={formData.imageUrl} alt="Dish preview" fill className="object-cover" />
                  </div>
                )}
              </div>

              {/* Video */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dish Video Presentation (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={formData.videoUrl ?? ""}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="MP4 URL or Upload"
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
                  />
                  <label className="cursor-pointer py-2 px-3 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs flex items-center gap-1 shrink-0">
                    <Video className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0], true)}
                      className="hidden"
                      disabled={uploadingVideo}
                    />
                  </label>
                </div>
                {uploadingVideo && <div className="text-[11px] text-gold-500">Uploading video...</div>}
                {formData.videoUrl && (
                  <div className="text-[11px] text-emerald-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Video attached
                  </div>
                )}
              </div>
            </div>

            {/* Calories and Prep Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.calories ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      calories: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="e.g. 450"
                  className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.prepTimeMinutes ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prepTimeMinutes: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="e.g. 15"
                  className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>
            </div>

            {/* Dietary Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Dietary Certifications
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {DIETARY_OPTIONS.map((tag) => {
                  const isChecked = formData.dietaryTags.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => toggleDietary(tag.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isChecked
                          ? "bg-foreground text-background border-foreground font-semibold"
                          : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allergens */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Contains Allergens
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALLERGEN_OPTIONS.map((allergen) => {
                  const isChecked = formData.allergens.includes(allergen.value);
                  return (
                    <label
                      key={allergen.value}
                      className="flex items-center gap-2 text-xs text-foreground cursor-pointer p-1.5 rounded-lg hover:bg-secondary/40"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAllergen(allergen.value)}
                        className="rounded text-gold-500 focus:ring-gold-500"
                      />
                      <span>{allergen.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Chef Special & Available Toggles */}
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between flex-wrap gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isChefSpecial}
                  onChange={(e) => setFormData({ ...formData, isChefSpecial: e.target.checked })}
                  className="rounded text-gold-500 focus:ring-gold-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Chef&apos;s Signature Special
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Prominently highlighted with gold ribbon
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-semibold text-foreground">Available to Order</div>
                  <div className="text-[11px] text-muted-foreground">
                    Uncheck to immediately 86 or mark sold out
                  </div>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-6 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-black hover:opacity-95 shadow-md shadow-gold-500/10 disabled:opacity-50"
              >
                {saving ? "Saving..." : initialData ? "Update Dish" : "Add Dish"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
