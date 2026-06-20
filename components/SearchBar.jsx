// components/SearchBar.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, ChevronRightIcon } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setselectedIndex] = useState(-1);
  const debouncedRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    debouncedRef.current = setTimeout(async () => {
      if (!query.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data?.suggestions || []);
        setIsOpen(data?.suggestions?.length > 0);
        setselectedIndex(-1);
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      setselectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      setselectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        router.push(suggestions[selectedIndex].href);
        setIsOpen(false);
        setQuery("");
      } else {
        router.push(`/shop?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const selectSuggestion = (href) => {
    router.push(href);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-full px-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-slate-500">
        <SearchIcon className="mr-2 text-slate-500" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search gadgets, brands, or categories..."
          className="w-full outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          aria-label="Search"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => selectSuggestion(s.href)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                idx === selectedIndex
                  ? "bg-slate-100 dark:bg-slate-800"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {s.image && (
                <img
                  src={s.image}
                  alt={s.name}
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <p className="text-slate-800 dark:text-slate-200 font-semibold">
                  {s.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  {s.type}
                </p>
              </div>
              <ChevronRightIcon size={16} className="text-slate-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
