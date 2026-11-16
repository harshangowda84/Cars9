"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { Cars9Logo } from "@/components/Cars9Logo";
import { 
  Search, 
  Sun, 
  Moon, 
  ShoppingBag, 
  FileText, 
  X,
  Car,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults?: Array<{ id: string; name: string; brand: string; subbrand: string; category: string }>;
  onSelectProduct?: (id: string) => void;
}

export function Navbar({ searchQuery, onSearchChange, searchResults = [], onSelectProduct }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { totalItems, setIsCartDrawerOpen } = useCart();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchFocused(false);
    if (typeof window !== "undefined" && window.location.pathname !== "/" && searchQuery.trim()) {
      window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-[#080b11]/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-20 gap-2 sm:gap-6">
          
          {/* Brand Logo Lockup */}
          <Cars9Logo size="md" />

          {/* Global Search Bar */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-lg hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                placeholder="Search accessories, DSP audio, LED laser lights, 7D mats..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-100/90 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Live Search Auto-complete Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 1 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between px-4 py-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <span>Search Results ({searchResults.length})</span>
                  <span className="text-[9px] opacity-70">Press Enter for full results view</span>
                </div>
                {searchResults.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {searchResults.slice(0, 6).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(item.id);
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {item.brand} • {item.subbrand} • <span className="text-red-500">{item.category}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No accessories matching &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            
            {/* Warranty Status Link - With visible title on all devices */}
            <Link
              href="/warranty"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition shadow-xs shrink-0"
              title="Verify or Register Digital Warranty"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              <span>Warranty</span>
            </Link>

            {/* Direct Quotation Link - With visible title on all devices */}
            <Link
              href="/quotation"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition shadow-xs shrink-0"
              title="View & Share Quotation"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" />
              <span>Quotation</span>
            </Link>

            {/* Dark & Light Theme Switcher */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              )}
            </button>

            {/* Enquiry Cart Trigger Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] sm:text-xs font-bold shadow-lg shadow-red-600/25 active:scale-95 transition shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden md:inline">Enquiries</span>
              {totalItems > 0 && (
                <span className="flex items-center justify-center min-w-4 sm:min-w-5 h-4 sm:h-5 px-1 text-[9px] sm:text-[10px] font-black bg-white text-red-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

          </div>

        </div>

        {/* Mobile Search Bar Row */}
        <div className="pb-2.5 pt-0.5 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search accessories, DSP, screens, LED..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

      </div>
    </header>
  );
}
