"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    nameAm?: string | null;
    description: string;
    descriptionAm?: string | null;
    imageUrl?: string;
  }) => Promise<void>;
  initialData?: {
    name: string;
    nameAm?: string | null;
    description?: string | null;
    descriptionAm?: string | null;
    imageUrl?: string | null;
  } | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [nameAm, setNameAm] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAm, setDescriptionAm] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setNameAm(initialData.nameAm || "");
      setDescription(initialData.description || "");
      setDescriptionAm(initialData.descriptionAm || "");
      setImageUrl(initialData.imageUrl || "");
    } else {
      setName("");
      setNameAm("");
      setDescription("");
      setDescriptionAm("");
      setImageUrl("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name,
        nameAm: nameAm.trim() || null,
        description,
        descriptionAm: descriptionAm.trim() || null,
        imageUrl: imageUrl || undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to save category");
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
          className="relative w-full max-w-md rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-luxury z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="font-serif text-2xl font-medium text-foreground">
            {initialData ? "Edit Menu Category" : "Add Menu Category"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Organize dishes into cohesive courses (e.g., Starters, Traditional Dishes / የባህል ምግቦች, Drinks).
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Category Name (EN) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Breakfast"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  ስም በአማርኛ (Optional)
                </label>
                <input
                  type="text"
                  value={nameAm}
                  onChange={(e) => setNameAm(e.target.value)}
                  placeholder="ምሳሌ፦ ቁርስ"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief introduction displayed above this section..."
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                መግለጫ በአማርኛ (Optional)
              </label>
              <textarea
                rows={2}
                value={descriptionAm}
                onChange={(e) => setDescriptionAm(e.target.value)}
                placeholder="የምድቡ አጭር መግለጫ..."
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-gold-500 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>

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
                {saving ? "Saving..." : initialData ? "Update Category" : "Add Category"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
