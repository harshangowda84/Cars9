"use client";

import React, { useState } from "react";
import { X, Check, Copy, Share2, ExternalLink } from "lucide-react";
import { CarPart } from "@/data/mockData";

interface ShareProductModalProps {
  product: CarPart | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareProductModal({ product, isOpen, onClose }: ShareProductModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://cars9.in";
  const shareUrl = `${currentOrigin}/products/${product.id}`;
  const shareText = `Discover ${product.name} (${product.brand} • ${product.subbrand}) at CARS9 Bespoke Automotive Studio:`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("input");
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 2C6.495 2 2 6.494 2 12.03c0 1.97.57 3.81 1.554 5.37L2 22l4.77-1.523A9.975 9.975 0 0 0 12.031 22c5.535 0 10.03-4.494 10.03-10.03C22.062 6.494 17.566 2 12.031 2zm5.82 14.28c-.24.67-1.39 1.28-1.92 1.34-.49.06-1.12.08-3.6-1.02-2.98-1.32-4.88-4.37-5.03-4.57-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.16 1.02-2.45.27-.29.59-.36.79-.36.2 0 .4 0 .58.01.19.01.44-.07.69.52.26.61.88 2.14.96 2.3.08.15.13.34.02.54-.1.2-.16.32-.31.5-.15.18-.32.4-.46.54-.15.15-.31.32-.13.63.18.31.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.46 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.84.87 2.15 1.03.31.15.52.23.6.36.08.14.08.79-.16 1.46z" />
        </svg>
      ),
      color: "bg-[#25D366] text-white hover:bg-[#1EBE5D]",
      action: () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
        window.open(url, "_blank");
      },
    },
    {
      name: "Facebook",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      color: "bg-[#1877F2] text-white hover:bg-[#166FE5]",
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank");
      },
    },
    {
      name: "Instagram",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      color: "bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white hover:opacity-90",
      action: async () => {
        await handleCopyLink();
        window.open("https://instagram.com", "_blank");
      },
    },
    {
      name: "X (Twitter)",
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "bg-black text-white hover:bg-slate-800",
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank");
      },
    },
    {
      name: "Telegram",
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      ),
      color: "bg-[#229ED9] text-white hover:bg-[#1E8EC4]",
      action: () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, "_blank");
      },
    },
  ];

  const displayImage = product.imageUrl || (product.images && product.images[0]) || "/images/placeholder.jpg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Share Accessory
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                CARS9 Studio Catalog
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Snippet */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#161e31] border border-slate-200/80 dark:border-slate-800">
          <img
            src={displayImage}
            alt={product.name}
            className="w-14 h-14 rounded-xl object-cover bg-slate-950 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
              {product.brand} • {product.subbrand}
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
              {product.name}
            </h4>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              SKU: {product.sku}
            </p>
          </div>
        </div>

        {/* Social Share Grid */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            Share via Social Channels
          </span>
          <div className="grid grid-cols-5 gap-2">
            {shareOptions.map((opt) => (
              <button
                key={opt.name}
                onClick={opt.action}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                title={`Share on ${opt.name}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${opt.color}`}>
                  {opt.icon}
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center truncate max-w-full">
                  {opt.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            Direct Shareable URL
          </span>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-2.5 text-xs text-slate-600 dark:text-slate-300 font-mono truncate focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Native Web Share Button */}
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>More Device Share Options</span>
          </button>
        )}
      </div>
    </div>
  );
}
