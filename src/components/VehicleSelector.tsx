"use client";

import React from "react";
import { Brand, CarPart } from "@/data/mockData";
import { getDisplayImageUrl } from "@/lib/imageUrl";
import { 
  RotateCcw, 
  ChevronRight, 
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  Car
} from "lucide-react";

interface VehicleSelectorProps {
  brands: Brand[];
  selectedBrand: string;
  selectedModel: string;
  selectedYear: string;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  onYearChange: (year: string) => void;
  onReset: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  products?: CarPart[];
}

const BRAND_DEFAULT_LOGOS: Record<string, string> = {
  bmw: "https://www.carlogos.org/car-logos/bmw-logo-2020-blue-white-640.png",
  hyundai: "https://www.carlogos.org/car-logos/hyundai-logo-2011-640.png",
  kia: "https://www.carlogos.org/car-logos/kia-logo-2021-640.png",
  mahindra: "https://www.carlogos.org/car-logos/mahindra-logo-2021-640.png",
  porsche: "https://www.carlogos.org/car-logos/porsche-logo-2014-640.png",
  tata: "https://www.carlogos.org/car-logos/tata-logo-2000-640.png",
  toyota: "https://www.carlogos.org/car-logos/toyota-logo-2020-europe-640.png",
  mercedes: "https://www.carlogos.org/car-logos/mercedes-benz-logo-2011-640.png",
  "mercedes-benz": "https://www.carlogos.org/car-logos/mercedes-benz-logo-2011-640.png",
  volkswagen: "https://www.carlogos.org/car-logos/volkswagen-logo-2019-640.png",
  "volkswagen-skoda": "https://www.carlogos.org/car-logos/volkswagen-logo-2019-640.png",
};

const DEFAULT_MODEL_CAR_IMAGE = "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80";

export function VehicleSelector({
  brands,
  selectedBrand,
  selectedModel,
  selectedYear,
  onBrandChange,
  onModelChange,
  onYearChange,
  onReset,
  searchQuery = "",
  onSearchChange,
  products = [],
}: VehicleSelectorProps) {
  // Current brand object
  const currentBrandObj = brands.find(
    (b) => b.name.toLowerCase() === selectedBrand.toLowerCase()
  );

  // Available models for selected brand
  const availableModels = currentBrandObj ? currentBrandObj.subbrands : [];

  // Current model object
  const currentModelObj = availableModels.find(
    (m) => m.name.toLowerCase() === selectedModel.toLowerCase()
  );

  // Available years for selected model
  const availableYears = currentModelObj ? currentModelObj.years : [];

  const isBrandSelected = selectedBrand !== "all" && Boolean(currentBrandObj);
  const isModelSelected = selectedModel !== "all" && Boolean(currentModelObj);

  // Helper: Count items for brand
  const getBrandItemsCount = (brandName: string) => {
    return products.filter(
      (p) => !p.isDeleted && p.brand.toLowerCase() === brandName.toLowerCase()
    ).length;
  };

  // Helper: Count accessories for model
  const getModelAccessoriesCount = (brandName: string, modelName: string) => {
    return products.filter((p) => {
      if (p.isDeleted) return false;
      const matchBrand = p.brand.toLowerCase() === brandName.toLowerCase();
      const matchModel =
        p.subbrand.toLowerCase() === modelName.toLowerCase() ||
        p.subbrand.toLowerCase() === "all models";
      return matchBrand && matchModel;
    }).length;
  };

  // Helper: Resolve logo URL
  const getBrandLogoUrl = (brand: Brand) => {
    if (brand.logo) return getDisplayImageUrl(brand.logo);
    const key = brand.name.toLowerCase().trim();
    if (BRAND_DEFAULT_LOGOS[key]) return BRAND_DEFAULT_LOGOS[key];
    const idKey = brand.id.toLowerCase().trim();
    if (BRAND_DEFAULT_LOGOS[idKey]) return BRAND_DEFAULT_LOGOS[idKey];
    return null;
  };

  // Helper: Resolve model car photo URL
  const getModelImageUrl = (model: { imageUrl?: string | null }) => {
    if (model.imageUrl) return getDisplayImageUrl(model.imageUrl);
    return DEFAULT_MODEL_CAR_IMAGE;
  };

  const scrollToCatalog = () => {
    const el = document.getElementById("catalog");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full relative z-20 mt-3 sm:mt-5 px-1.5 sm:px-4">
      <div className="max-w-6xl mx-auto rounded-2xl sm:rounded-3xl p-3 sm:p-5 bg-white/95 dark:bg-[#0c1019]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl transition-all">
        
        {/* ================================================================= */}
        {/* VIEW 1: BRAND CARDS SELECTOR (Step 1)                            */}
        {/* ================================================================= */}
        {!isBrandSelected ? (
          <div className="space-y-3 sm:space-y-4">
            
            {/* Header: Top Manufacturers / Select Car Brand */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-amber-500 uppercase">
                  Top Manufacturers
                </span>
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-0.5">
                  Select Car Brand
                </h2>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Showing {brands.length} Brands
              </div>
            </div>

            {/* Grid of Brand Cards (Balanced & Centered with Zero Waste Space) */}
            <div className={`grid gap-2 sm:gap-3 ${
              brands.length <= 2 
                ? "grid-cols-2 max-w-sm sm:max-w-md mx-auto" 
                : brands.length <= 4 
                  ? "grid-cols-2 sm:grid-cols-4 max-w-3xl mx-auto" 
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            }`}>
              {brands.map((brand) => {
                const isSelected = selectedBrand.toLowerCase() === brand.name.toLowerCase();
                const logoUrl = getBrandLogoUrl(brand);
                const modelsCount = brand.subbrands ? brand.subbrands.length : 0;
                const itemsCount = getBrandItemsCount(brand.name);

                return (
                  <div
                    key={brand.id}
                    onClick={() => {
                      onBrandChange(brand.name);
                    }}
                    className={`rounded-xl sm:rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group ${
                      isSelected
                        ? "bg-slate-900 dark:bg-[#121622] border-2 border-amber-400 ring-2 ring-amber-400/20 shadow-xl"
                        : "bg-slate-50/90 dark:bg-[#121622]/80 hover:bg-white dark:hover:bg-[#181d2c] border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 shadow-xs hover:shadow-xl hover:-translate-y-0.5"
                    }`}
                  >
                    {/* White Square Container for Brand Logo */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white p-1.5 sm:p-2.5 flex items-center justify-center shadow-xs sm:shadow-md mb-1.5 sm:mb-2 group-hover:scale-105 transition-transform duration-300 overflow-hidden border border-slate-200/80">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${brand.name} logo`}
                          className="max-w-full max-h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-sm sm:text-base font-black text-slate-800 uppercase font-mono">
                          {brand.name.slice(0, 3)}
                        </span>
                      )}
                    </div>

                    {/* Brand Name */}
                    <h3
                      className={`text-xs sm:text-sm font-extrabold transition-colors ${
                        isSelected
                          ? "text-amber-400"
                          : "text-slate-900 dark:text-white group-hover:text-amber-400"
                      }`}
                    >
                      {brand.name}
                    </h3>

                    {/* Subtitle: X Models • Y Items */}
                    <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {modelsCount} Models • {itemsCount} Items
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          /* =============================================================== */
          /* VIEW 2: MODEL CARDS SELECTOR (Step 2 - Reveals on Brand Click)  */
          /* =============================================================== */
          <div className="space-y-3 sm:space-y-4">
            
            {/* Top Breadcrumb & Reset Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => onBrandChange("all")}
                  className="font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Brands</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {currentBrandObj?.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onBrandChange("all")}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 transition"
                >
                  Change Brand
                </button>
                <button
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Model Section Header */}
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentBrandObj?.name} Models
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select your vehicle model to view custom-fit accessories.
              </p>
            </div>

            {/* Grid of Model Cards */}
            {availableModels.length > 0 ? (
              <div className={`grid gap-2.5 sm:gap-3.5 ${
                availableModels.length <= 2 
                  ? "grid-cols-2 max-w-lg mx-auto" 
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
              }`}>
                {availableModels.map((model) => {
                  const isSelected = selectedModel.toLowerCase() === model.name.toLowerCase();
                  const carImageUrl = getModelImageUrl(model);
                  const accessoriesCount = getModelAccessoriesCount(
                    currentBrandObj?.name || "",
                    model.name
                  );

                  return (
                    <div
                      key={model.name}
                      onClick={() => {
                        onModelChange(isSelected ? "all" : model.name);
                        scrollToCatalog();
                      }}
                      className={`rounded-xl sm:rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 group ${
                        isSelected
                          ? "bg-slate-900 dark:bg-[#141824] border-2 border-amber-400 ring-2 ring-amber-400/20 shadow-xl scale-[1.01]"
                          : "bg-slate-50/90 dark:bg-[#121622] hover:bg-white dark:hover:bg-[#161b2a] border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 shadow-xs hover:shadow-xl hover:-translate-y-0.5"
                      }`}
                    >
                      {/* Top Half: Car Photo */}
                      <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
                        <img
                          src={carImageUrl}
                          alt={`${currentBrandObj?.name} ${model.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                        
                        {isSelected && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-black font-black text-[9px] font-mono flex items-center gap-1 shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>SELECTED</span>
                          </div>
                        )}
                      </div>

                      {/* Middle: Model Name & Fitments Subtitle */}
                      <div className="p-2 sm:p-3 flex-1 flex flex-col justify-center">
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-amber-400 transition-colors">
                          {model.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {currentBrandObj?.name} {model.name} Fitments
                        </p>
                      </div>

                      {/* Bottom Footer Bar: X Accessories (Gold) & Explore -> */}
                      <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-black/20 flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
                        <span className="font-bold text-amber-500">
                          {accessoriesCount} Accessories
                        </span>
                        <span className="font-semibold text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs font-mono">
                No specific models registered for {currentBrandObj?.name}. Showing all general fitments.
              </div>
            )}

            {/* Active Model Fitment Banner & Year Selector */}
            {isModelSelected && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-[#121622] text-white border border-amber-400/40 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-black text-[10px] font-mono uppercase">
                        ACTIVE FITMENT
                      </span>
                      <span className="text-xs font-extrabold text-white">
                        {currentBrandObj?.name} {currentModelObj?.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                      Showing accessories custom engineered for this vehicle.
                    </span>
                  </div>
                </div>

                {/* Optional Model Years Filter Pills */}
                {availableYears.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Year:</span>
                    <button
                      onClick={() => onYearChange("all")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                        selectedYear === "all"
                          ? "bg-amber-400 text-black"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      All
                    </button>
                    {availableYears.map((yr) => (
                      <button
                        key={yr}
                        onClick={() => onYearChange(selectedYear === yr ? "all" : yr)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                          selectedYear === yr
                            ? "bg-amber-400 text-black"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
