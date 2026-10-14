"use client";

import React from "react";
import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`p-2 rounded-full transition-all duration-200 border border-border/60 hover:border-gold-500/50 bg-secondary/50 hover:bg-secondary text-foreground hover:text-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40 ${className}`}
      aria-label="Toggle color theme"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4 text-foreground/80" />}
    </button>
  );
}
