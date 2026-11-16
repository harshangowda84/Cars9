"use client";

import React, { useState, useEffect } from "react";
import { CarPart } from "@/data/mockData";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { getDisplayImageUrl } from "@/lib/imageUrl";
import { ShareProductModal } from "@/components/ShareProductModal";
import { 
  X, 
  ShieldCheck, 
  Play, 
  ShoppingBag, 
  MessageSquare, 
  Check, 
  Share2, 
  ChevronRight,
  Wrench,
  Camera,
  Video,
  Clock
} from "lucide-react";

interface ProductDetailModalProps {
  product: CarPart | null;
  onClose: () => void;
  selectedVehicle?: { brand: string; model: string; year: string };
}

export function ProductDetailModal({ product, onClose, selectedVehicle }: ProductDetailModalProps) {
  const { addToCart, items } = useCart();
  const { settings } = useSettings();
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Reset active media when product changes
  useEffect(() => {
    setActiveMediaIndex(0);
    setIsHovered(false);
  }, [product?.id]);

  if (!product) return null;

  // Media gallery: 5 to 6 high-res photos
  const imageList = product.images && product.images.length > 0 
    ? product.images 
    : [product.imageUrl || "/images/placeholder.jpg"];

  // Total media includes video at the end if available and enabled
  const hasVideo = Boolean(product.videoUrl) && (settings.pdp_showVideoPlayer !== false);
  const isViewingVideo = hasVideo && activeMediaIndex === imageList.length;

  // Auto-play slideshow every 2 seconds (pauses on hover or when video is viewed)
  useEffect(() => {
    if (isViewingVideo || isHovered || imageList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveMediaIndex((prev) => (prev + 1) % imageList.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isViewingVideo, isHovered, imageList.length]);

  const isInCart = items.some((i) => i.id === product.id);

  const handleShareWhatsApp = () => {
    const vehicleText = selectedVehicle?.brand && selectedVehicle.brand !== "all" 
      ? ` for ${selectedVehicle.brand} ${selectedVehicle.model !== "all" ? selectedVehicle.model : ""} ${selectedVehicle.year !== "all" ? `(${selectedVehicle.year})` : ""}`
      : ` for ${product.brand} ${product.subbrand}`;

    const text = `Hello Cars9 Studio! I am inquiring about:
*Product:* ${product.name}
*SKU:* ${product.sku}
*Vehicle Fitment:* ${vehicleText}
Please share custom quotation, studio bay availability & installation schedule.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/products/${product.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0a0e18]/80">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
            <span>{product.brand}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{product.subbrand}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-red-500 font-bold">{product.category}</span>
          </div>

          <div className="flex items-center gap-2">
            {settings.pdp_showDirectShareLink !== false && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                title="Share product"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Media Gallery (5-6 Images + 1 Video) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              
              {/* Main Media Viewer */}
              <div 
                className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {isViewingVideo ? (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <video
                      src={product.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <img
                    src={getDisplayImageUrl(imageList[activeMediaIndex] || product.imageUrl)}
                    alt={`${product.name} - slide ${activeMediaIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                )}

                {product.badge && settings.plp_showBadges !== false && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-600 text-white shadow-md">
                    {product.badge}
                  </div>
                )}

                {/* Slideshow Progress Dot Indicator */}
                {!isViewingVideo && imageList.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md z-10">
                    {imageList.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveMediaIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          activeMediaIndex === i ? "w-5 bg-red-500" : "w-1.5 bg-white/50 hover:bg-white"
                        }`}
                        title={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      activeMediaIndex === idx && !isViewingVideo
                        ? "border-red-600 scale-95 shadow-md"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getDisplayImageUrl(img)}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 text-white px-1 rounded">
                      #{idx + 1}
                    </span>
                  </button>
                ))}

                {/* Video Thumbnail (Admin On/Off Controlled) */}
                {hasVideo && (
                  <button
                    onClick={() => setActiveMediaIndex(imageList.length)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 bg-slate-950 flex flex-col items-center justify-center text-white transition-all ${
                      isViewingVideo
                        ? "border-red-600 scale-95 shadow-md"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white mb-0.5">
                      <Play className="w-3 h-3 ml-0.5 fill-white" />
                    </div>
                    <span className="text-[9px] font-mono font-bold">Video</span>
                  </button>
                )}
              </div>

            </div>

            {/* Right Column: Title, Description & Fitment */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-500 uppercase">
                      {product.brand} • {product.subbrand}
                    </span>
                    <span className="text-slate-400 font-mono text-xs">• SKU: {product.sku}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {product.name}
                  </h3>
                </div>

                {/* Vehicle Fitment Card (Admin On/Off Controlled) */}
                {settings.pdp_showCompatibilityBanner !== false && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-400 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Guaranteed Vehicle Compatibility</span>
                    </div>
                    <div className="font-mono text-[11px] text-emerald-900/80 dark:text-emerald-300/80">
                      Precision engineered for {product.brand} {product.subbrand}.
                      {product.compatibleYears && (
                        <span> Years: {product.compatibleYears.join(", ")}</span>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {product.description}
                </p>

                {/* Studio Bay Time (Admin On/Off Controlled) */}
                {settings.pdp_showBayTimeEstimate !== false && (product.specifications?.["Installation Slot"] || product.specifications?.["bayTime"]) && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-800 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Estimated Bay Time: {product.specifications["Installation Slot"] || product.specifications["bayTime"]}</span>
                  </div>
                )}

                {/* Specs Pill List (Admin On/Off Controlled) */}
                {settings.pdp_showSpecsTab !== false && product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Technical Highlights
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      {Object.entries(product.specifications).slice(0, 4).map(([k, v]) => (
                        <div key={k} className="p-2 rounded-xl bg-slate-50 dark:bg-[#161e31] border border-slate-200/80 dark:border-slate-800">
                          <span className="text-slate-400 block text-[9px] uppercase">{k}</span>
                          <span className="font-bold text-slate-900 dark:text-white truncate block">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <button
                  onClick={() => {
                    addToCart({
                      id: product.id,
                      name: product.name,
                      sku: product.sku,
                      brand: product.brand,
                      subbrand: product.subbrand,
                      category: product.category,
                      imageUrl: product.imageUrl,
                      warrantyMonths: product.warrantyMonths,
                    });
                    onClose();
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98 ${
                    isInCart
                      ? "bg-slate-800 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isInCart ? "Already in Quotation" : "Add to Quotation / Enquiry"}</span>
                </button>

                {settings.pdp_showWhatsAppEnquiry !== false && (
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Inquire on WhatsApp</span>
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Share Product Modal */}
      <ShareProductModal
        product={product}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
