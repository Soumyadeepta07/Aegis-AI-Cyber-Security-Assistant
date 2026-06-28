"use client";

import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className="p-2 rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-cyan-400 hover:bg-slate-900/50 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0 html.light:border-slate-300"
    >
      {theme === "dark" ? (
        <Sun className="h-4.5 w-4.5 text-cyan-400 transition-all rotate-0 scale-100" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-indigo-500 transition-all rotate-0 scale-100" />
      )}
    </button>
  );
}
