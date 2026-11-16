"use client";

import React from "react";
import Link from "next/link";
import { CarPart } from "@/data/mockData";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { getDisplayImageUrl } from "@/lib/imageUrl";
import { 
  Plus, 
  Check, 
  Eye, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  SlidersHorizontal, 
  Camera, 
  Video 
} from "lucide-react";

interface ProductListingProps {
  products: CarPart[];
  onSelectProduct: (product: CarPart) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  hideHeader?: boolean;
}

const CATEGORIES = [
  "All",
  "Infotainment & Audio",
  "Lighting & Electrical",
  "Interior Styling",
  "Exterior Styling",
  "Car Care & Utility"
];

export function ProductListing({
  products,
  onSelectProduct,
  selectedCategory,
  onCategoryChange,
  hideHeader = false,
}: ProductListingProps) {
  const { addToCart, items } = useCart();
  const { settings } = useSettings();

  return (
    <section id="catalog" className={`w-full ${hideHeader ? "pt-1 pb-6" : "pt-2 sm:pt-4 pb-8 sm:pb-12"}`}>
      
      {/* Category Navigation Pills & Header */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5 sm:gap-4 mb-3 sm:mb-5 pb-2 sm:pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-600 dark:text-red-400 uppercase">
                Curated Accessories
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[10px] font-mono text-slate-400">
                {products.length} Products Available
              </span>
            </div>
            <h2 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Precision Automotive Accessories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 max-w-xl">
              Custom engineered upgrades with 100% coupler-to-coupler fitment. Zero factory harness splicing.
            </p>
          </div>

          {/* Category Pill Tabs (Admin On/Off Controlled) */}
          {settings.plp_showCategoryTabs && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-102"
                      : "bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLP Product Grid: Pictures Only, NO PRICES */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
          {products.map((item) => {
            const isAdded = items.some((cartItem) => cartItem.id === item.id);

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between bg-white dark:bg-[#0f1523] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Image Container with Link to Standalone PDP */}
                <Link
                  href={`/products/${item.id}`}
                  className="relative aspect-4/3 w-full bg-slate-950 overflow-hidden block"
                >
                  <img
                    src={getDisplayImageUrl(item.imageUrl || (item.images && item.images[0]))}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                      settings.plp_enableHoverZoom ? "group-hover:scale-105" : ""
                    }`}
                    loading="lazy"
                  />
                  
                  {/* Subtle Vignette Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Badge (Admin On/Off Controlled) */}
                  {settings.plp_showBadges && item.badge && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
                      {item.badge}
                    </div>
                  )}

                  {/* Media Count Pill (Admin On/Off Controlled) */}
                  {settings.plp_showMediaCountPill && (
                    <div className="absolute bottom-3 right-3 opacity-90 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-mono">
                      <Camera className="w-3 h-3" />
                      <span>{item.images?.length || 1} Photos</span>
                      {item.videoUrl && settings.pdp_showVideoPlayer !== false && settings.plp_showVideo !== false && (
                        <>
                          <span>•</span>
                          <Video className="w-3 h-3 text-red-400" />
                          <span>1 Video</span>
                        </>
                      )}
                    </div>
                  )}
                </Link>

                {/* Card Content & Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Vehicle Compatibility & Category */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                      <span className="text-red-600 dark:text-red-400 font-bold uppercase">
                        {item.brand} • {item.subbrand}
                      </span>
                      <span>{item.category}</span>
                    </div>

                    {/* Product Name with Link */}
                    <Link href={`/products/${item.id}`}>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition cursor-pointer">
                        {item.name}
                      </h3>
                    </Link>

                    {/* Short Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed font-normal">
                      {item.description}
                    </p>

                    {/* Coupler Fitment Tag (Admin On/Off Controlled) */}
                    {settings.plp_showCouplerBadge && (
                      <div className="mt-3.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>OEM Coupler-to-Coupler Fitment</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                    <Link
                      href={`/products/${item.id}`}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition text-center"
                    >
                      Media & Specs
                    </Link>

                    {/* Quick Preview Button (Admin On/Off Controlled) */}
                    {settings.plp_showQuickPreview && (
                      <button
                        onClick={() => onSelectProduct(item)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
                        title="Quick Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({
                          id: item.id,
                          name: item.name,
                          sku: item.sku,
                          brand: item.brand,
                          subbrand: item.subbrand,
                          category: item.category,
                          imageUrl: item.imageUrl,
                          warrantyMonths: item.warrantyMonths,
                        });
                      }}
                      className={`p-2.5 rounded-xl font-bold transition active:scale-95 flex items-center justify-center ${
                        isAdded
                          ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
                      }`}
                      title="Add to Enquiry List"
                    >
                      {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
          <p className="text-sm font-semibold text-slate-400">
            No accessories matched your vehicle or search filter.
          </p>
          <button
            onClick={() => onCategoryChange("All")}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
