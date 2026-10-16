"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Video, Sparkles, Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
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
  categories?: { id: string; name: string }[];
  initialData?: (DishFormData & { id?: string }) | null;
  currencySymbol: string;
}

export function DishModal({
  isOpen,
  onClose,
  onSave,
  categoryId,
  categories = [],
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

  const [priceInput, setPriceInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [caloriesInput, setCaloriesInput] = useState("");
  const [prepTimeInput, setPrepTimeInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSavedBanner(null);
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
      setPriceInput(String(initialData.price ?? ""));
      setDiscountInput(initialData.discountPrice ? String(initialData.discountPrice) : "");
      setCaloriesInput(initialData.calories ? String(initialData.calories) : "");
      setPrepTimeInput(initialData.prepTimeMinutes ? String(initialData.prepTimeMinutes) : "");
      const hasAdv = Boolean(
        initialData.discountPrice ||
          initialData.videoUrl ||
          initialData.calories ||
          initialData.prepTimeMinutes ||
          (initialData.dietaryTags && initialData.dietaryTags.length > 0) ||
          (initialData.allergens && initialData.allergens.length > 0)
      );
      setShowAdvanced(hasAdv);
    } else {
      setFormData({
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
      setPriceInput("");
      setDiscountInput("");
      setCaloriesInput("");
      setPrepTimeInput("");
      setShowAdvanced(false);
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

  const submitForm = async (keepOpen: boolean) => {
    const parsedPrice = parseFloat(priceInput);
    if (!formData.name.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      alert("Please enter a valid dish name and price.");
      return;
    }

    setSaving(true);
    setSavedBanner(null);
    try {
      const activeCatId = formData.categoryId || categoryId;
      await onSave({
        ...formData,
        name: formData.name.trim(),
        categoryId: activeCatId,
        price: parsedPrice,
        discountPrice: discountInput.trim() ? parseFloat(discountInput) : null,
        calories: caloriesInput.trim() ? parseInt(caloriesInput, 10) : null,
        prepTimeMinutes: prepTimeInput.trim() ? parseInt(prepTimeInput, 10) : null,
      });

      if (keepOpen && !initialData) {
        const addedName = formData.name.trim();
        setFormData({
          categoryId: activeCatId,
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
        setPriceInput("");
        setDiscountInput("");
        setCaloriesInput("");
        setPrepTimeInput("");
        setSavedBanner(`"${addedName}" added! Ready for the next dish.`);
      } else {
        onClose();
      }
    } catch (err: any) {
      alert(err.message || "Failed to save dish");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(false);
  };

  const advancedCount =
    (discountInput.trim() ? 1 : 0) +
    (formData.videoUrl ? 1 : 0) +
    (caloriesInput.trim() ? 1 : 0) +
    (prepTimeInput.trim() ? 1 : 0) +
    formData.dietaryTags.length +
    formData.allergens.length;

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
            Enter the essentials below. Expand optional culinary details for dietary tags, allergens, nutrition, or video.
          </p>

          {savedBanner && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{savedBanner}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Category Selector if multiple categories exist */}
            {categories.length > 1 && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Course / Category
                </label>
                <select
                  value={formData.categoryId || categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dish Name & Price on one row for rapid entry */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pan-Seared Hokkaido Scallops"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Price ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="e.g. 24.00"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Description & Ingredients (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.description ?? ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Craftsmanship details, provenance of ingredients, pairing notes..."
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dish Photography (Optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={formData.imageUrl ?? ""}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="Paste image URL or upload a photo"
                  className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-gold-500"
                />
                <label className="cursor-pointer py-2 px-3 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs flex items-center gap-1.5 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
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
                <div className="relative w-full h-28 rounded-xl overflow-hidden bg-muted border border-border">
                  <Image src={formData.imageUrl} alt="Dish preview" fill className="object-cover" />
                </div>
              )}
            </div>

            {/* Chef Special & Available Toggles */}
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between flex-wrap gap-4">
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

            {/* Collapsible Advanced Details */}
            <div className="rounded-2xl border border-border/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="w-full px-4 py-3 bg-secondary/25 hover:bg-secondary/40 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>Dietary, Allergens, Nutrition & Video</span>
                  {advancedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 text-[10px]">
                      {advancedCount} set
                    </span>
                  )}
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="p-4 space-y-5 border-t border-border/60 bg-background/40">
                  {/* Special Offer Price, Calories, Prep Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Offer Price ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-xs text-foreground focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Calories (kcal)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={caloriesInput}
                        onChange={(e) => setCaloriesInput(e.target.value)}
                        placeholder="e.g. 450"
                        className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-xs text-foreground focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Prep Time (min)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={prepTimeInput}
                        onChange={(e) => setPrepTimeInput(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-xs text-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Video Presentation */}
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
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              {!initialData && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => submitForm(true)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border border-gold-500/50 bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save & Add Another"}</span>
                </button>
              )}
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
