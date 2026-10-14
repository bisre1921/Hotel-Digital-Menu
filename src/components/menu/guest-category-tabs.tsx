"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";

interface CategoryTab {
  id: string;
  name: string;
  count: number;
}

interface GuestCategoryTabsProps {
  categories: CategoryTab[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  primaryColor?: string;
}

export function GuestCategoryTabs({
  categories,
  activeCategory,
  onSelectCategory,
  primaryColor = "#B89334",
}: GuestCategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleClick = (id: string) => {
    onSelectCategory(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      const yOffset = -120; // Account for sticky headers
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-0 z-30 py-3 bg-background/85 backdrop-blur-md border-b border-border/60 transition-colors">
      <div
        ref={scrollRef}
        className="max-w-5xl mx-auto px-4 flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth"
      >
        <button
          onClick={() => handleClick("all")}
          className={`relative px-4 py-2 rounded-full text-xs md:text-sm font-medium tracking-wide uppercase whitespace-nowrap transition-all duration-300 ${
            activeCategory === "all"
              ? "text-black shadow-md font-semibold"
              : "text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary"
          }`}
          style={activeCategory === "all" ? { backgroundColor: primaryColor } : undefined}
        >
          All Items
        </button>

        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.id)}
              className={`relative px-4 py-2 rounded-full text-xs md:text-sm font-medium tracking-wide uppercase whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "text-black shadow-md font-semibold"
                  : "text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary"
              }`}
              style={isActive ? { backgroundColor: primaryColor } : undefined}
            >
              <span>{cat.name}</span>
              <span className="ml-1.5 opacity-70 text-[10px]">({cat.count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
