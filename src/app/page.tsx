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
import { GoogleMapsLogo } from "@/components/GoogleMapsLogo";
import { Footer } from "@/components/Footer";
import { useSettings } from "@/context/SettingsContext";
import { useCart } from "@/context/CartContext";
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
  const { setIsCartDrawerOpen } = useCart();

  // If user navigates from quotation back to cart (?openCart=true)
  useEffect(() => {
    if (searchParams.get("openCart") === "true") {
      setIsCartDrawerOpen(true);
    }
  }, [searchParams, setIsCartDrawerOpen]);

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
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-4 space-y-3 sm:space-y-5">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 pt-0 sm:pt-1">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white truncate">Zero Wire Slicing</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate block">100% OEM Couplers</span>
                </div>
              </div>

              <Link
                href="/warranty"
                className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2 sm:gap-2.5 hover:border-emerald-500/50 transition group"
                title="Check Digital Warranty Certificate"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors truncate">Warranty Protected</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate block">Verify Certificate →</span>
                </div>
              </Link>

              <a
                href={`https://wa.me/${(settings.footer_phone || "919000000000").replace(/\D/g, "")}?text=${encodeURIComponent("Hello Cars9 Studio! I am interested in custom accessories and fitment consultation.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2 sm:gap-2.5 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition group cursor-pointer"
                title="Chat Directly with Studio on WhatsApp"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 2C6.495 2 2 6.494 2 12.03c0 1.97.57 3.81 1.554 5.37L2 22l4.77-1.523A9.975 9.975 0 0 0 12.031 22c5.535 0 10.03-4.494 10.03-10.03C22.062 6.494 17.566 2 12.031 2zm5.82 14.28c-.24.67-1.39 1.28-1.92 1.34-.49.06-1.12.08-3.6-1.02-2.98-1.32-4.88-4.37-5.03-4.57-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.16 1.02-2.45.27-.29.59-.36.79-.36.2 0 .4 0 .58.01.19.01.44-.07.69.52.26.61.88 2.14.96 2.3.08.15.13.34.02.54-.1.2-.16.32-.31.5-.15.18-.32.4-.46.54-.15.15-.31.32-.13.63.18.31.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.46 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.84.87 2.15 1.03.31.15.52.23.6.36.08.14.08.79-.16 1.46z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-[#25D366] transition-colors truncate">WhatsApp Studio</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate block">Direct Studio Chat &rarr;</span>
                </div>
              </a>

              <a
                href={settings.footer_maps_url || "https://maps.google.com/?q=Cars9+Automotive+Studio+Bangalore"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0f1523] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2 sm:gap-2.5 hover:border-red-500/40 transition group cursor-pointer"
                title="Open Studio Location on Google Maps"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform p-1.5 shadow-xs">
                  <GoogleMapsLogo className="w-full h-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="block text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                      Store Locator
                    </span>
                    <GoogleMapsLogo className="w-3 h-3 shrink-0" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate block">Google Maps &rarr;</span>
                </div>
              </a>
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
