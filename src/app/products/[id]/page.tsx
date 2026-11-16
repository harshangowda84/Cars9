"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CarPart } from "@/data/mockData";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import TechnicalDrawing from "@/components/TechnicalDrawing";
import { getDisplayImageUrl } from "@/lib/imageUrl";
import { ShareProductModal } from "@/components/ShareProductModal";
import { 
  ShieldCheck, 
  Play, 
  ShoppingBag, 
  MessageSquare, 
  Check, 
  Share2, 
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  Award,
  Plus,
  Minus
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { addToCart, items } = useCart();
  const { settings } = useSettings();

  const [product, setProduct] = useState<CarPart | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<CarPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"specs" | "inbox" | "installation">("specs");
  const [isHovered, setIsHovered] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isManuallyStopped, setIsManuallyStopped] = useState(false);

  // Auto-play slideshow interval config from admin settings
  const isSlideshowEnabled = settings.pdp_enableSlideshow !== false;
  const slideshowIntervalSec = Math.max(1, Number(settings.pdp_slideshowInterval) || 2);

  // Media gallery: 5 to 6 images + 1 video as the final slide
  const imageList = product?.images && product.images.length > 0 
    ? product.images 
    : [product?.imageUrl || "/images/placeholder.jpg"];

  const hasVideo = Boolean(product?.videoUrl) && (settings.pdp_showVideoPlayer !== false);
  const isViewingVideo = hasVideo && activeMediaIndex === imageList.length;
  const isInCart = product ? items.some((i) => i.id === product.id) : false;

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/parts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);

          // Fetch related accessories for the same brand/subbrand
          const resAll = await fetch(`/api/parts`);
          if (resAll.ok) {
            const allParts: CarPart[] = await resAll.json();
            const related = allParts.filter(
              (p) => p.id !== data.id && (p.brand === data.brand || p.subbrand === data.subbrand)
            ).slice(0, 4);
            setRelatedProducts(related);
          }
        }
      } catch (err) {
        console.error("Failed to load accessory detail", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  // Auto-play slideshow (pauses on hover, video, or user tap on image)
  useEffect(() => {
    if (!isSlideshowEnabled || isManuallyStopped || !product || isViewingVideo || isHovered || imageList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveMediaIndex((prev) => (prev + 1) % imageList.length);
    }, slideshowIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [isSlideshowEnabled, isManuallyStopped, product, isViewingVideo, isHovered, imageList.length, slideshowIntervalSec]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar searchQuery="" onSearchChange={() => {}} />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center space-y-3 font-mono text-xs text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin mx-auto" />
            <span>LOADING PRODUCT SPECIFICATION & MEDIA...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 flex flex-col">
        <Navbar searchQuery="" onSearchChange={() => {}} />
        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
          <p className="text-sm font-bold text-slate-500">Accessory not found in studio inventory.</p>
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs">
            Return to Studio Catalog
          </Link>
        </div>
      </div>
    );
  }

  // WhatsApp Enquiry
  const handleShareWhatsApp = () => {
    const text = `Hello Cars9 Studio! I am inquiring about:
*Product:* ${product.name}
*SKU:* ${product.sku}
*Vehicle Fitment:* ${product.brand} ${product.subbrand}
*Category:* ${product.category}
Please share custom quotation, studio bay availability & installation schedule.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Copy Direct Link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top Navigation */}
      <Navbar searchQuery="" onSearchChange={() => {}} />

      {/* Main PDP Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link href="/" className="hover:text-red-500 transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Catalog</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 dark:text-slate-300 font-semibold">{product.brand}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600 dark:text-slate-300 font-semibold">{product.subbrand}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-red-500 font-bold truncate max-w-xs">{product.name}</span>
        </div>

        {/* Top Product Showcase: Gallery (Left) + Details & Fitment (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Column: Media Stage (5-6 Photos + 1 Video) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Primary High-Res Viewer */}
            <div 
              className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-center group cursor-pointer"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setIsManuallyStopped((prev) => !prev)}
              title={isManuallyStopped ? "Click to resume slideshow" : "Click on image to stop slideshow"}
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
                  className="w-full h-full object-cover object-center transition-all duration-300"
                />
              )}

              {/* Badges */}
              {product.badge && (
                <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-red-600 text-white shadow-lg z-10">
                  {product.badge}
                </div>
              )}

              {/* Share Product Modal Button (Admin On/Off Controlled) */}
              {settings.pdp_showDirectShareLink !== false && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShareModalOpen(true);
                  }}
                  className="absolute top-4 right-4 p-2.5 rounded-2xl bg-black/50 hover:bg-black/80 backdrop-blur-md text-white transition cursor-pointer z-10 active:scale-95"
                  title="Share Accessory"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}

              {/* Slideshow Paused Indicator */}
              {isManuallyStopped && !isViewingVideo && isSlideshowEnabled && imageList.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-amber-400 flex items-center gap-1.5 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Slideshow Paused (Tap to Resume)</span>
                </div>
              )}

              {/* Slideshow Progress Dot Indicator */}
              {!isViewingVideo && imageList.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md z-10">
                  {imageList.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMediaIndex(i);
                        setIsManuallyStopped(true);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        activeMediaIndex === i ? "w-5 bg-red-500" : "w-1.5 bg-white/50 hover:bg-white"
                      }`}
                      title={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Navigation Row: 5-6 Photos + 1 Video at the end */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveMediaIndex(idx);
                    setIsManuallyStopped(true);
                  }}
                  className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
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
                  <span className="absolute bottom-1 right-1 text-[9px] font-mono font-black bg-black/80 text-white px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                </button>
              ))}

              {/* Dedicated Video Thumbnail (Admin On/Off Controlled) */}
              {hasVideo && (
                <button
                  onClick={() => setActiveMediaIndex(imageList.length)}
                  className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border-2 bg-slate-950 flex flex-col items-center justify-center text-white transition-all ${
                    isViewingVideo
                      ? "border-red-600 scale-95 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-400 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg mb-1">
                    <Play className="w-4 h-4 ml-0.5 fill-white" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-tight text-white uppercase">
                    Demo Video
                  </span>
                </button>
              )}
            </div>

            {/* CAD Technical Drawing Preview Box (Admin On/Off Controlled) */}
            {settings.pdp_showCadSchematic !== false && (
              <div className="p-5 rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                    Engineering CAD Schematic
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Millimeter-Accurate Coupler & Chassis Fitment
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Verified with OEM wiring harnesses. Zero vehicle modification needed.
                  </p>
                </div>

                <div className="p-2 rounded-2xl bg-slate-50 dark:bg-[#161e31] shrink-0 border border-slate-200/60 dark:border-slate-800">
                  <TechnicalDrawing partName={product.name} className="w-20 h-20" />
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Title, Specifications & Enquiry Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              
              {/* Eyebrow & Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400">
                  {product.category}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  SKU: {product.sku}
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>In Stock</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Guaranteed Vehicle Fitment Card (Admin On/Off Controlled) */}
              {settings.pdp_showCompatibilityBanner !== false && (
                <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs sm:text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Guaranteed Vehicle Compatibility</span>
                  </div>
                  <div className="text-xs text-emerald-900 dark:text-emerald-300 font-mono">
                    Engineered specifically for: <strong>{product.brand} {product.subbrand}</strong>
                    {product.compatibleYears && product.compatibleYears.length > 0 && (
                      <div className="mt-1 text-[11px] text-emerald-800 dark:text-emerald-400">
                        Compatible Model Years: {product.compatibleYears.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 pt-1">
                    ✓ 100% Plug-and-Play Coupler Fitment • Zero Wire Slicing • Factory Warranty Safe
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {product.description}
              </p>

              {/* Key Technical Highlights */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Core Specifications
                  </span>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono bg-white dark:bg-[#0f1523]">
                    {Object.entries(product.specifications).slice(0, 5).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2.5 px-4">
                        <span className="text-slate-500">{k}</span>
                        <span className="font-bold text-slate-900 dark:text-white text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warranty and Installation Time (Admin On/Off Controlled) */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Studio Warranty</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {product.warrantyMonths || 12} Months On-Site
                  </span>
                </div>
                {settings.pdp_showBayTimeEstimate !== false && (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Installation Slot</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      Approx 60–90 Mins Bay Time
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Enquiry Actions (NO PRICE SHOWN ON PUBLIC PDP) */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              
              {/* Quantity Selector & Add to Quote */}
              <div className="flex items-center gap-3">
                {/* Quantity Counter (Admin On/Off Controlled) */}
                {settings.pdp_showQuantitySelector !== false && (
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-2xl p-1 bg-white dark:bg-[#0f1523]">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:text-red-500 text-slate-500 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:text-emerald-500 text-slate-500 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => addToCart({
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    brand: product.brand,
                    subbrand: product.subbrand,
                    category: product.category,
                    imageUrl: product.imageUrl,
                    warrantyMonths: product.warrantyMonths,
                  }, settings.pdp_showQuantitySelector !== false ? quantity : 1)}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition active:scale-98 ${
                    isInCart
                      ? "bg-slate-800 text-white hover:bg-slate-700"
                      : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isInCart ? "In Enquiry List (Add More)" : "Add to Enquiry / Quotation"}</span>
                </button>

                {/* Share Accessory Button */}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f1523] text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-400 transition flex items-center justify-center shrink-0 shadow-sm cursor-pointer active:scale-95"
                  title="Share this accessory"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* WhatsApp Direct Enquiry Button (Admin On/Off Controlled) */}
              {settings.pdp_showWhatsAppEnquiry !== false && (
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-98"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enquire Price & Installation on WhatsApp</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Tabbed Detailed Sections (Admin On/Off Controlled) */}
        {(settings.pdp_showSpecsTab !== false || settings.pdp_showWhatsInBoxTab !== false || settings.pdp_showInstallationProtocolTab !== false) && (
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              {settings.pdp_showSpecsTab !== false && (
                <button
                  onClick={() => setActiveTab("specs")}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-mono font-bold transition ${
                    activeTab === "specs"
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Full Specifications
                </button>
              )}
              {settings.pdp_showWhatsInBoxTab !== false && (
                <button
                  onClick={() => setActiveTab("inbox")}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-mono font-bold transition ${
                    activeTab === "inbox"
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  What&apos;s In The Box
                </button>
              )}
              {settings.pdp_showInstallationProtocolTab !== false && (
                <button
                  onClick={() => setActiveTab("installation")}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-mono font-bold transition ${
                    activeTab === "installation"
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Studio Bay Installation
                </button>
              )}
            </div>

            {activeTab === "specs" && settings.pdp_showSpecsTab !== false && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {product.specifications && Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="p-4 rounded-2xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 flex justify-between">
                    <span className="text-slate-400 font-semibold">{key}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "inbox" && settings.pdp_showWhatsInBoxTab !== false && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-5 rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 space-y-2">
                  <Package className="w-5 h-5 text-red-500" />
                  <span className="font-bold block text-slate-900 dark:text-white">Main Component</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    1x {product.name} with factory inspection seal and component serial number.
                  </p>
                </div>
                <div className="p-5 rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 space-y-2">
                  <Wrench className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold block text-slate-900 dark:text-white">OEM Coupler Harness</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Dedicated plug-and-play wiring harness specifically pinned for {product.brand} {product.subbrand}.
                  </p>
                </div>
                <div className="p-5 rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 space-y-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span className="font-bold block text-slate-900 dark:text-white">Studio Warranty Certificate</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Official Cars9 on-site warranty card with QR code registration and digital guarantee.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "installation" && settings.pdp_showInstallationProtocolTab !== false && (
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Cars9 Studio Bay Zero Wire Slicing Protocol
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  All installations are carried out inside closed, dust-controlled studio bays by certified master technicians. Every harness is routed along factory cable channels using automotive-grade Tesa cloth tape to prevent rattling and vibrations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161e31] font-mono text-[11px]">
                    <strong>1. Pre-Scan:</strong> Full OBD diagnostics inspection before install.
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161e31] font-mono text-[11px]">
                    <strong>2. Coupler Fit:</strong> Direct mating into original vehicle sockets.
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161e31] font-mono text-[11px]">
                    <strong>3. Calibration:</strong> Precision acoustic & optical alignment test.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Related Accessories Section (Admin On/Off Controlled) */}
        {settings.pdp_showRelatedProducts !== false && relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-600 dark:text-red-400 uppercase">
                Complete Your Setup
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Related Compatible Accessories
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/products/${rel.id}`}
                  className="group rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all p-4 space-y-3"
                >
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-950">
                    <img src={getDisplayImageUrl(rel.imageUrl || (rel.images && rel.images[0]))} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-red-500 font-bold uppercase">{rel.brand} • {rel.subbrand}</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5">{rel.name}</h4>
                    <span className="text-[11px] text-slate-400 line-clamp-1 mt-1">{rel.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Product Share Modal */}
      <ShareProductModal
        product={product}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Dynamic Studio Footer */}
      <Footer />

    </div>
  );
}
