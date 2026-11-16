"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CarPart, Brand, initialBrands, initialParts } from "@/data/mockData";
import { Navbar } from "@/components/Navbar";
import { HeroCarousel } from "@/components/HeroCarousel";
import { VehicleSelector } from "@/components/VehicleSelector";
import { ProductListing } from "@/components/ProductListing";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { Cars9Logo } from "@/components/Cars9Logo";
import { Footer } from "@/components/Footer";
import { useSettings } from "@/context/SettingsContext";
import { 
  Car, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Mail, 
  Sparkles, 
  CheckCircle,
  Clock,
  Layers,
  Award,
  Wrench,
  Volume2,
  Cpu,
  Search,
  X
} from "lucide-react";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings } = useSettings();

  // Data states
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [products, setProducts] = useState<CarPart[]>(initialParts);
  const [loading, setLoading] = useState(false);

  // Filter states (Vehicle Cascade: Brand -> Model -> Year)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // PDP Modal state
  const [selectedProduct, setSelectedProduct] = useState<CarPart | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [resBrands, resParts] = await Promise.all([
          fetch("/api/brands"),
          fetch("/api/parts")
        ]);

        if (resBrands.ok) {
          const bData = await resBrands.json();
          if (Array.isArray(bData) && bData.length > 0) setBrands(bData);
        }

        if (resParts.ok) {
          const pData = await resParts.json();
          if (Array.isArray(pData) && pData.length > 0) setProducts(pData);
        }
      } catch (err) {
        console.warn("Using offline fallback mock data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Direct product linking support (e.g. ?product=C9-AUD-001)
  useEffect(() => {
    const prodId = searchParams.get("product");
    if (prodId && products.length > 0) {
      const match = products.find((p) => p.id === prodId);
      if (match) setSelectedProduct(match);
    }
  }, [searchParams, products]);

  // URL search parameter support (e.g. ?q=led or ?search=led)
  useEffect(() => {
    const qParam = searchParams.get("q") || searchParams.get("search");
    if (qParam !== null && qParam !== undefined) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    if (typeof window !== "undefined") {
      router.replace("/", { scroll: false });
    }
  };

  // Brand selection resets model & year
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel("all");
    setSelectedYear("all");
  };

  // Model selection resets year
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setSelectedYear("all");
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  const handleResetVehicleFilter = () => {
    setSelectedBrand("all");
    setSelectedModel("all");
    setSelectedYear("all");
  };

  // Categories matching active search query across products
  const availableCategoriesForSearch = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const matching = products.filter((item) => {
      const haystack = `${item.name} ${item.brand} ${item.subbrand} ${item.sku} ${item.category} ${item.description}`.toLowerCase();
      return haystack.includes(q);
    });
    const set = new Set<string>();
    matching.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products, searchQuery]);

  const searchMatchingProductsWithoutCategory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return products.filter((item) => {
      const haystack = `${item.name} ${item.brand} ${item.subbrand} ${item.sku} ${item.category} ${item.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [products, searchQuery]);

  // Filter products dynamically
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // 1. Brand filter
      if (selectedBrand !== "all") {
        const matchBrand =
          item.brand.toLowerCase() === selectedBrand.toLowerCase() ||
          item.brand.toLowerCase() === "universal";
        if (!matchBrand) return false;
      }

      // 2. Model filter
      if (selectedModel !== "all") {
        const matchModel =
          item.subbrand.toLowerCase() === selectedModel.toLowerCase() ||
          item.subbrand.toLowerCase() === "all models" ||
          item.brand.toLowerCase() === "universal";
        if (!matchModel) return false;
      }

      // 3. Year filter
      if (selectedYear !== "all") {
        const years = item.compatibleYears || ["All"];
        const matchYear = years.includes("All") || years.includes(selectedYear);
        if (!matchYear) return false;
      }

      // 4. Category filter
      if (selectedCategory !== "All") {
        if (item.category !== selectedCategory) return false;
      }

      // 5. Global Search bar match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const haystack = `${item.name} ${item.brand} ${item.subbrand} ${item.sku} ${item.category} ${item.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [products, selectedBrand, selectedModel, selectedYear, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080b11] text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 1. Navbar (Sticky with Global Search, Theme Switch, Enquiry Drawer) */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={filteredProducts}
        onSelectProduct={(id) => {
          router.push(`/products/${id}`);
        }}
      />

      {/* 2. Main Page Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-6 space-y-4 sm:space-y-10 lg:space-y-12">
        {searchQuery.trim().length > 0 ? (
          /* ========================================================================= */
          /* DEDICATED SEARCH RESULTS PAGE VIEW */
          /* ========================================================================= */
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Dedicated Search Header Bar */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                    <button
                      onClick={handleClearSearch}
                      className="hover:text-red-600 transition underline underline-offset-4"
                    >
                      Home
                    </button>
                    <span>/</span>
                    <span className="text-red-500 font-bold">Search Results</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
                    <span>Search Results for</span>
                    <span className="text-red-600">&ldquo;{searchQuery}&rdquo;</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    {filteredProducts.length === 1
                      ? "Found 1 matching automotive accessory"
                      : `Found ${filteredProducts.length} matching accessories across all categories`}
                  </p>
                </div>

                <button
                  onClick={handleClearSearch}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition self-start sm:self-auto shadow-sm"
                >
                  <X className="w-4 h-4 text-red-500" />
                  <span>Clear Search</span>
                </button>
              </div>

              {/* Category Filter Pills inside Search Results */}
              {availableCategoriesForSearch.length > 1 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                    Filter by:
                  </span>
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedCategory === "All"
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    All Categories ({searchMatchingProductsWithoutCategory.length})
                  </button>
                  {availableCategoriesForSearch.map((cat) => {
                    const count = searchMatchingProductsWithoutCategory.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                          selectedCategory === cat
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Product Grid or Clean Empty State */}
            {filteredProducts.length > 0 ? (
              <ProductListing
                products={filteredProducts}
                onSelectProduct={(p) => setSelectedProduct(p)}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                hideHeader={true}
              />
            ) : (
              <div className="p-12 sm:p-16 rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 text-center space-y-6 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    No accessories found for &ldquo;{searchQuery}&rdquo;
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    We couldn&apos;t find any matching products. Try searching for broader terms or explore popular car accessory categories below.
                  </p>
                </div>

                {/* Suggestion Pills */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Popular Searches
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                    {["LED", "Projector", "Cockpit", "360 Cam", "DSP", "Floor Mats", "Ambient Light", "Fortuner", "Creta", "Thar"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSearchQuery(tag);
                          setSelectedCategory("All");
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 transition"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleClearSearch}
                    className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/25 transition inline-flex items-center gap-2"
                  >
                    <span>View Full Product Catalog</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Top Hero Section: 5 Hero Banners Auto-Carousel */}
            <div className="relative">
              <HeroCarousel
                onExploreClick={() => {
                  const el = document.getElementById("catalog");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              />

              {/* Prominent Vehicle Selector Configurator Dock (Brand -> Model -> Year) */}
              {settings.plp_showVehicleCascade && (
                <VehicleSelector
                  brands={brands}
                  selectedBrand={selectedBrand}
                  selectedModel={selectedModel}
                  selectedYear={selectedYear}
                  onBrandChange={handleBrandChange}
                  onModelChange={handleModelChange}
                  onYearChange={handleYearChange}
                  onReset={handleResetVehicleFilter}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  products={products}
                />
              )}
            </div>

            {/* Studio Engineering Highlights Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 pt-1 sm:pt-6">
              <div className="p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm flex items-center gap-2.5 sm:gap-3.5">
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white truncate">Zero Wire Slicing</span>
                  <span className="text-[9px] sm:text-[11px] text-slate-400 font-mono truncate block">100% OEM Couplers</span>
                </div>
              </div>

              <Link
                href="/warranty"
                className="p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm flex items-center gap-2.5 sm:gap-3.5 hover:border-emerald-500/50 transition group"
                title="Check Digital Warranty Certificate"
              >
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors truncate">Warranty Protected</span>
                  <span className="text-[9px] sm:text-[11px] text-slate-400 font-mono truncate block">Verify Certificate →</span>
                </div>
              </Link>

              <div className="p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm flex items-center gap-2.5 sm:gap-3.5">
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white truncate">Acoustic Tuning</span>
                  <span className="text-[9px] sm:text-[11px] text-slate-400 font-mono truncate block">31-Band DSP</span>
                </div>
              </div>

              <div className="p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm flex items-center gap-2.5 sm:gap-3.5">
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white truncate">Studio Bay Slot</span>
                  <span className="text-[9px] sm:text-[11px] text-slate-400 font-mono truncate block">Certified Techs</span>
                </div>
              </div>
            </div>

            {/* Product Listing Page (PLP - Pictures Only, No Price) */}
            <ProductListing
              products={filteredProducts}
              onSelectProduct={(p) => setSelectedProduct(p)}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </>
        )}

      </main>

      {/* 3. Global PDP Modal (5-6 Photos + 1 Video) */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        selectedVehicle={{
          brand: selectedBrand,
          model: selectedModel,
          year: selectedYear,
        }}
      />

      {/* 4. Luxury Production Dynamic Footer */}
      <Footer onSelectCategory={setSelectedCategory} />

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400 font-mono">Loading CARS9 Studio...</div>}>
      <HomeContent />
    </Suspense>
  );
}
