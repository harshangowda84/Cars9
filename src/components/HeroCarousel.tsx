"use client";

import React, { useState, useEffect } from "react";
import { Banner, initialBanners } from "@/data/mockData";
import { ChevronLeft, ChevronRight, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { getDisplayImageUrl } from "@/lib/imageUrl";

interface HeroCarouselProps {
  onExploreClick?: () => void;
}

export function HeroCarousel({ onExploreClick }: HeroCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function loadBanners() {
      try {
        const res = await fetch("/api/banners");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setBanners(data);
          }
        }
      } catch (err) {
        console.warn("Using default hero banners", err);
      }
    }
    loadBanners();
  }, []);

  // Auto-carousel rotation every 5 seconds
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (banners.length === 0) return null;

  const current = banners[currentIndex];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xl sm:shadow-2xl transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Media Carousel */}
      <div className="relative h-[280px] sm:h-[380px] lg:h-[420px] w-full">
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
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
          </div>
        ))}

        {/* Content Container */}
        <div className="relative z-20 h-full flex flex-col justify-center px-4 sm:px-14 lg:px-20 max-w-3xl pb-8 sm:pb-0">
          {current.badge && (
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-red-600/90 text-white w-fit backdrop-blur-md shadow-sm mb-2 sm:mb-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{current.badge}</span>
            </div>
          )}

          <h1 className="text-xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-2 sm:mb-4 drop-shadow-md">
            {current.title}
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-slate-300 font-normal leading-relaxed mb-3.5 sm:mb-8 max-w-xl line-clamp-2 sm:line-clamp-none">
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
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-300 px-4 py-2.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Zero Wire Slicing Guarantee</span>
            </div>
          </div>
        </div>

        {/* Previous & Next Navigation Controls */}
        <button
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition active:scale-90"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition active:scale-90"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Dot Pagination Indicators */}
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full h-2 ${
                idx === currentIndex ? "w-8 bg-red-600" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
