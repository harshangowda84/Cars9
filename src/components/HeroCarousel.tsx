"use client";

import React, { useState, useEffect } from "react";
import { Banner } from "@/data/mockData";
import { ChevronLeft, ChevronRight, ShieldCheck, ArrowRight } from "lucide-react";
import { getDisplayImageUrl } from "@/lib/imageUrl";
import { useSettings } from "@/context/SettingsContext";
import { useTheme } from "@/context/ThemeContext";

interface HeroCarouselProps {
  onExploreClick?: () => void;
}

export function HeroCarousel({ onExploreClick }: HeroCarouselProps) {
  const { settings } = useSettings();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function loadBanners() {
      try {
        const res = await fetch("/api/banners");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setBanners(data);
          } else {
            setBanners([]);
          }
        }
      } catch (err) {
        console.warn("Using default hero banners", err);
        setBanners([]);
      } finally {
        setIsLoaded(true);
      }
    }
    loadBanners();
  }, []);

  // Auto-carousel rotation every 5 seconds (only when more than 1 banner)
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const handlePrev = () => {
    if (banners.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    if (banners.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  // If banners are still loading initial fetch, render skeleton
  if (!isLoaded) {
    return (
      <div className="relative w-full h-[280px] sm:h-[380px] lg:h-[420px] rounded-2xl sm:rounded-[2.5rem] bg-slate-200 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 animate-pulse" />
    );
  }

  // CASE 1: No active hero banners -> Render Default Fallback Page Banner
  if (banners.length === 0) {
    const title1 = settings.default_banner_title1 || "ELEVATE YOUR CAR WITH";
    const title2 = settings.default_banner_title2 || "CUSTOM ACCESSORIES";
    const subtitle = settings.default_banner_subtitle || "Discover custom 7D floor mats, Nappa leatherette seat covers, app-controlled ambient lighting, 4K dual-lens dash cams, and off-road enhancements engineered to fit your exact vehicle model.";
    const ctaText = settings.default_banner_cta || "EXPLORE BRANDS";

    // Use light-specific image if in light mode and configured, else fallback
    const bgImage = (isLight && settings.default_banner_image_light?.trim())
      ? settings.default_banner_image_light.trim()
      : (settings.default_banner_image || "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1920&auto=format&fit=crop");

    return (
      <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xl sm:shadow-2xl transition-colors">
        <div className="relative h-[290px] sm:h-[390px] lg:h-[430px] w-full flex items-center justify-center text-center">
          {/* Background Image */}
          <img
            src={getDisplayImageUrl(bgImage)}
            alt="Default Hero Banner"
            className="absolute inset-0 w-full h-full object-cover object-center transform scale-102"
          />

          {/* Adaptive Overlay: Clean bright frosted veil in Light Mode, deep cinematic vignette in Dark Mode */}
          <div className="absolute inset-0 bg-white/85 dark:bg-black/75 backdrop-blur-[0.5px] transition-colors" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/55 to-white/85 dark:from-black/95 dark:via-black/40 dark:to-black/85 transition-colors" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/80 dark:from-black/80 dark:via-transparent dark:to-black/80 transition-colors" />

          {/* Centered Content: Adaptive Typography */}
          <div className="relative z-20 px-5 sm:px-12 max-w-3xl flex flex-col items-center justify-center animate-in fade-in duration-500">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight mb-2 sm:mb-3 text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-lg transition-colors">
              <span>{title1}</span>
              <span className="block text-red-600 dark:text-amber-400 sm:mt-1 drop-shadow-sm dark:drop-shadow-[0_2px_14px_rgba(245,158,11,0.5)] transition-colors">
                {title2}
              </span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-5 sm:mb-7 max-w-2xl transition-colors">
              {subtitle}
            </p>

            <button
              onClick={() => {
                if (onExploreClick) onExploreClick();
                else {
                  const el = document.getElementById("vehicle-selector") || document.getElementById("catalog");
                  el?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 active:scale-95 transition-all group"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASE 2: 1 or more banners -> Render carousel (hide controls if only 1 banner)
  const current = banners[currentIndex] || banners[0];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xl sm:shadow-2xl transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Media Carousel */}
      <div className="relative h-[290px] sm:h-[400px] lg:h-[440px] w-full">
        {banners.map((b, idx) => (
          <div
            key={b.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <img
              src={getDisplayImageUrl(b.imageUrl)}
              alt={b.title}
              className="w-full h-full object-cover object-center transform scale-102 transition-transform duration-10000"
            />
            {/* Adaptive Gradient Overlays: Light in Light Mode, Dark in Dark Mode */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/20 dark:from-black/95 dark:via-black/70 dark:to-black/20 transition-colors" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent dark:from-black dark:via-transparent dark:to-transparent opacity-90 transition-colors" />
          </div>
        ))}

        {/* Content Container */}
        <div className="relative z-20 h-full flex flex-col justify-center px-4 sm:px-14 lg:px-20 max-w-3xl pb-10 sm:pb-12">
          {current.badge && (
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-red-600 text-white w-fit shadow-md mb-2 sm:mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{current.badge}</span>
            </div>
          )}

          <h1 className="text-xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12] mb-2 sm:mb-3 drop-shadow-sm dark:drop-shadow-md transition-colors">
            {current.title}
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-3.5 sm:mb-5 max-w-xl line-clamp-2 sm:line-clamp-none transition-colors">
            {current.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <button
              onClick={() => {
                if (onExploreClick) onExploreClick();
                else {
                  const el = document.getElementById("catalog");
                  el?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="inline-flex items-center gap-2 px-4 sm:px-7 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/35 active:scale-95 transition-all group"
            >
              <span>{current.ctaText || "Explore Accessories"}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Zero Wire Slicing Guarantee</span>
            </div>
          </div>
        </div>

        {/* Carousel controls - ONLY SHOW IF MORE THAN 1 BANNER */}
        {banners.length > 1 && (
          <>
            {/* Previous & Next Navigation Controls */}
            <button
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-white/60 hover:bg-white/90 dark:bg-black/40 dark:hover:bg-black/80 text-slate-800 dark:text-white backdrop-blur-md border border-slate-200 dark:border-white/10 transition active:scale-90 shadow-md"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next Slide"
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-white/60 hover:bg-white/90 dark:bg-black/40 dark:hover:bg-black/80 text-slate-800 dark:text-white backdrop-blur-md border border-slate-200 dark:border-white/10 transition active:scale-90 shadow-md"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Dot Pagination Indicators */}
            <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full h-2 ${
                    idx === currentIndex
                      ? "w-8 bg-red-600"
                      : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-white/40 dark:hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
