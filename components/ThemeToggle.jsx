"use client";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const OPTIONS = [
  { id: "light", label: "Light", icon: SunIcon },
  { id: "dark", label: "Dark", icon: MoonIcon },
];

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const activeTheme = theme === "system" ? resolvedTheme : theme;

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className={`flex items-center rounded-full border border-slate-200 dark:border-slate-700 ${compact ? "p-0.5" : "p-1"} bg-white dark:bg-slate-900`}>
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => setTheme(option.id)}
          className={`inline-flex items-center justify-center rounded-full transition ${
            compact ? "h-8 w-8" : "h-8 px-3 text-xs gap-1.5"
          } ${
            activeTheme === option.id
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-200 hover:text-slate-800 dark:text-slate-200 dark:hover:text-slate-100"
          }`}
          aria-label={`Switch to ${option.label} theme`}
          title={option.label}
        >
          <option.icon size={14} />
          {!compact && <span>{option.label}</span>}
        </button>
      ))}
    </div>
  );
}
