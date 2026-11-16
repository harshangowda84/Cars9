"use client";

import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function FloatingCartPill() {
  const { totalItems, isCartDrawerOpen, setIsCartDrawerOpen } = useCart();

  const [isHovered, setIsHovered] = useState(false);
  const [autoExpanded, setAutoExpanded] = useState(false);
  const [badgeBump, setBadgeBump] = useState(false);
  const [mounted, setMounted] = useState(false);

  const prevCountRef = useRef(totalItems);
  const isFirstRender = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startAutoCollapseTimer = (ms = 3500) => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      setAutoExpanded(false);
    }, ms);
  };

  // Listen for cart item additions
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevCountRef.current = totalItems;
      return;
    }

    if (totalItems > prevCountRef.current) {
      // Product added or increased: expand on the right side!
      setAutoExpanded(true);
      setBadgeBump(true);
      setTimeout(() => setBadgeBump(false), 300);

      // Keep expanded for 3.5 seconds, then collapse
      startAutoCollapseTimer(3500);
    } else if (totalItems === 0) {
      setAutoExpanded(false);
      clearTimer();
    }

    prevCountRef.current = totalItems;
  }, [totalItems]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearTimer();
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Pause auto-collapse timer while user hovers over the pill
    clearTimer();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // If it was auto-expanded from an addition, resume collapse timer briefly
    if (autoExpanded) {
      startAutoCollapseTimer(1500);
    }
  };

  const handleOpenCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCartDrawerOpen(true);
  };

  // Do not render before hydration, or when cart is empty, or when drawer is open
  if (!mounted || totalItems === 0 || isCartDrawerOpen) {
    return null;
  }

  // Expanded whenever user hovers OR when newly added
  const isExpanded = isHovered || autoExpanded;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleOpenCart}
      style={{
        width: isExpanded ? "310px" : "56px",
      }}
      className={`fixed bottom-6 right-6 z-40 h-14 bg-slate-900/95 dark:bg-[#0f1523]/95 text-white backdrop-blur-xl rounded-full shadow-2xl border border-slate-700/70 select-none overflow-hidden cursor-pointer flex items-center transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] hover:shadow-red-900/20 hover:border-slate-600 ${
        isExpanded ? "px-3.5 justify-between" : "justify-center p-0"
      }`}
      title={!isExpanded ? `View Enquiry Cart (${totalItems} items)` : undefined}
      aria-label="Enquiry Cart"
    >
      {/* ---------------------------------------------------- */}
      {/* Collapsed State: Compact Circular Button on Right    */}
      {/* ---------------------------------------------------- */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          !isExpanded ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"
        }`}
      >
        <div className="relative flex items-center justify-center w-full h-full">
          <ShoppingBag className="w-5 h-5 text-white" />
          <span
            className={`absolute top-2 right-2 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center shadow-xs border border-slate-900 transition-transform duration-200 ${
              badgeBump ? "scale-130" : "scale-100"
            }`}
          >
            {totalItems}
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Expanded State: Full Pill View Expanding to Left     */}
      {/* ---------------------------------------------------- */}
      <div
        className={`flex items-center justify-between w-full gap-2.5 transition-all duration-300 ${
          isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Left: Red Circle Badge + Item Count Text */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-mono font-extrabold text-xs shrink-0 shadow-md transition-transform duration-200 ${
              badgeBump ? "scale-125" : "scale-100"
            }`}
          >
            {totalItems}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight text-white truncate">
              {totalItems} {totalItems === 1 ? "Accessory" : "Accessories"} in List
            </p>
            <p className="text-[10px] font-mono text-emerald-400 leading-tight truncate">
              Ready for Studio Quote
            </p>
          </div>
        </div>

        {/* Separator Line */}
        <div className="h-5 w-px bg-slate-700/80 shrink-0" />

        {/* Right: View Cart White Pill Button */}
        <button
          type="button"
          onClick={handleOpenCart}
          className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0 cursor-pointer active:scale-95"
        >
          <span>View List</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
