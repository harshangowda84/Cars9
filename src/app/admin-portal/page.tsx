"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Banner, CarPart, Brand } from "@/data/mockData";
import { useSettings } from "@/context/SettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { 
  ShieldCheck, 
  Lock, 
  LogOut, 
  Image as ImageIcon, 
  Sliders, 
  Package, 
  Inbox, 
  Upload, 
  Plus, 
  Trash2, 
  Edit2, 
  Edit3, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Car, 
  Save, 
  RefreshCw,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Share2,
  Printer,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  ToggleLeft,
  ToggleRight,
  LayoutGrid,
  FileCode,
  Wrench,
  Award,
  MapPin,
  KeyRound,
  Zap,
  Shield,
  FileText,
  Camera,
  Video,
  UploadCloud,
  Send,
  Undo2,
  RotateCcw,
  AlertTriangle,
  CheckSquare,
  Square,
  Archive,
  Menu,
  Sparkles,
  ChevronUp,
  ArrowUpDown,
  ArrowUpToLine
} from "lucide-react";
import { Cars9Logo } from "@/components/Cars9Logo";
import { getDisplayImageUrl } from "@/lib/imageUrl";

interface QuotationRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    brand?: string;
    subbrand?: string;
    category?: string;
    unitPrice?: number;
    laborCharge?: number;
    installationCharge?: number;
    total?: number;
  }>;
  subtotal?: number;
  laborTotal?: number;
  installationTotal?: number;
  discountAmount?: number;
  isGstEnabled?: boolean;
  customGstRate?: number;
  taxAmount?: number;
  grandTotal?: number;
  isPriced?: boolean;
  notes?: string;
  status: string;
  createdAt: string;
}

interface WarrantyRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  invoiceNo: string;
  vehicleRegNo: string;
  productName: string;
  productId: string;
  serialNumber: string;
  purchaseDate: string;
  expiryDate: string;
  warrantyMonths: number;
  studioLocation: string;
  status: string;
}

const COMMON_YEARS = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"];

export default function AdminPortalPage() {
  const { settings, updateSetting } = useSettings();

  // Dark/Light Theme unified with global ThemeContext
  const { theme, toggleTheme } = useTheme();
  const adminTheme = theme;
  const toggleAdminTheme = toggleTheme;

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authRole, setAuthRole] = useState<"admin" | "staff">("staff");
  const [loginMode, setLoginMode] = useState<"admin" | "staff">("staff");
  
  // Login Inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [staffPasswordInput, setStaffPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Tab State: First page is ALWAYS enquiries, second is ALWAYS warranties
  type AdminTab = 
    | "enquiries" 
    | "warranties" 
    | "inventory" 
    | "brands" 
    | "banners" 
    | "plp_settings" 
    | "pdp_settings" 
    | "branding_footer" 
    | "security" 
    | "uploader";
  const [activeTab, setActiveTab] = useState<AdminTab>("enquiries");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Data States
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<CarPart[]>([]);
  const [recycleBin, setRecycleBin] = useState<CarPart[]>([]);
  const [catalogSubTab, setCatalogSubTab] = useState<"active" | "recycle_bin">("active");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<Brand | null>(null);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandForm, setNewBrandForm] = useState({ name: "", logo: "" });
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [newModelForm, setNewModelForm] = useState<{ name: string; imageUrl: string; years: string[] }>({ name: "", imageUrl: "", years: COMMON_YEARS });
  const [editingBrandLogo, setEditingBrandLogo] = useState<{ id: string; name: string; logo: string } | null>(null);
  const [editingModelPhoto, setEditingModelPhoto] = useState<{ brandId: string; brandName: string; modelName: string; photo: string } | null>(null);
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [uploadingModelPhoto, setUploadingModelPhoto] = useState(false);
  const [enquiries, setEnquiries] = useState<QuotationRecord[]>([]);
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------------
  // Banner Tab States
  // -------------------------------------------------------------
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // -------------------------------------------------------------
  // Inventory Tab States
  // -------------------------------------------------------------
  const [invSearch, setInvSearch] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Recycle Bin Filter & Selection States
  const [recycleSearch, setRecycleSearch] = useState("");
  const [recycleBrandFilter, setRecycleBrandFilter] = useState<string | null>(null);
  const [recycleCategoryFilter, setRecycleCategoryFilter] = useState<string | null>(null);
  const [selectedRecycleIds, setSelectedRecycleIds] = useState<string[]>([]);

  // 5-Second Undo Toast State
  const [undoItem, setUndoItem] = useState<CarPart | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(5);
  const [toastNotice, setToastNotice] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const undoTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss toast notice after 3.5 seconds
  useEffect(() => {
    if (toastNotice) {
      const timer = setTimeout(() => {
        setToastNotice(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastNotice]);

  // Brands & Models Management Search & Sub-Tab State
  const [brandSearch, setBrandSearch] = useState("");
  const [brandSubTab, setBrandSubTab] = useState<"active" | "recycle_bin">("active");
  const [showArrangeBrandsModal, setShowArrangeBrandsModal] = useState(false);
  const [savingBrandOrder, setSavingBrandOrder] = useState(false);

  // Custom Delete Alert / Confirmation Dialog State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    part?: CarPart | null;
    isPermanent?: boolean;
    mode?: "single" | "bulk_selected" | "bulk_filtered" | "empty_all";
    count?: number;
    title?: string;
    description?: string;
  }>({ isOpen: false });

  // Add / Edit Product Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CarPart | null>(null);

  // Dynamic Cascade in Add/Edit Product Modal
  const [inlineNewBrand, setInlineNewBrand] = useState(false);
  const [inlineBrandName, setInlineBrandName] = useState("");
  const [inlineNewModel, setInlineNewModel] = useState(false);
  const [inlineModelName, setInlineModelName] = useState("");
  const [inlineNewCategory, setInlineNewCategory] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Custom Years in Product Modal
  const [customYears, setCustomYears] = useState<string[]>([]);
  const [newYearInput, setNewYearInput] = useState("");
  const [showAddYearInput, setShowAddYearInput] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    brand: "Toyota",
    subbrand: "Fortuner",
    category: "Infotainment & Audio",
    sku: "",
    description: "",
    price: 15000,
    stock: 10,
    location: "Studio Bay A-1",
    images: ["", "", "", "", ""],
    videoUrl: "",
    compatibleYears: ["2024", "2023", "2022", "2021", "2020"],
    badge: "OEM Coupler",
    warrantyValue: 12,
    warrantyUnit: "months" as "days" | "months" | "years",
    warrantyMonths: 12,
    bayTime: "60–90 Mins Bay Time",
    whatsInBox: "1x Main Unit, 1x OEM Coupler Harness, 1x Studio Warranty Card",
    installationGuide: "100% Plug-and-play coupler mating into factory sockets. Zero wire splicing required.",
    specs: "Wiring: OEM Plug & Play\nWarranty: 1 Year\nScreen: IPS Anti-Glare",
    oemNumber: "",
    material: "",
    dimensions: "",
    weight: "",
  });

  // -------------------------------------------------------------
  // Enquiries & Quotation Pricing Desk States
  // -------------------------------------------------------------
  const [selectedEnquiry, setSelectedEnquiry] = useState<QuotationRecord | null>(null);
  const [pricingItems, setPricingItems] = useState<any[]>([]);
  const [quoteDiscount, setQuoteDiscount] = useState<number>(0);
  const [customInstallationCharge, setCustomInstallationCharge] = useState<number | null>(null);
  const [isGstEnabled, setIsGstEnabled] = useState<boolean>(true);
  const [customGstRate, setCustomGstRate] = useState<number>(18);
  const [showPrintQuoteModal, setShowPrintQuoteModal] = useState<boolean>(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteSavedSuccess, setQuoteSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // -------------------------------------------------------------
  // Warranty Tab States (Admin View & Register)
  // -------------------------------------------------------------
  const [warrantySearch, setWarrantySearch] = useState("");
  const [showRegisterWarrantyModal, setShowRegisterWarrantyModal] = useState(false);
  const [registeringWarranty, setRegisteringWarranty] = useState(false);
  const [newWarrantyForm, setNewWarrantyForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    invoiceNo: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
    vehicleRegNo: "",
    productName: "ApexPro 8-Channel DSP Amplifier with 31-Band Parametric EQ",
    serialNumber: `C9-SN-${Math.floor(1000 + Math.random() * 9000)}`,
    purchaseDate: new Date().toISOString().split("T")[0],
    warrantyMonths: 24,
    studioLocation: "Cars9 Flagship Studio, Indiranagar, Bangalore"
  });

  // -------------------------------------------------------------
  // Security & Password Control State
  // -------------------------------------------------------------
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [passwordSavedMsg, setPasswordSavedMsg] = useState("");
  const [showCurrentAdminPass, setShowCurrentAdminPass] = useState(false);
  const [showCurrentStaffPass, setShowCurrentStaffPass] = useState(false);

  // -------------------------------------------------------------
  // Branding & Footer Editor State
  // -------------------------------------------------------------
  const logoFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [footerForm, setFooterForm] = useState({
    description: "",
    guaranteeText: "",
    phone: "",
    email: "",
    address: "",
    mapsUrl: "",
    timings: "",
    copyright: "",
    showWarranty: true,
    showPricing: true,
    showAdmin: true,
    socialInstagram: "",
    socialFacebook: "",
    socialYoutube: "",
    socialWhatsapp: "",
    socialTwitter: "",
  });
  const [footerSavedMsg, setFooterSavedMsg] = useState("");
  const [uploadingSiteLogo, setUploadingSiteLogo] = useState(false);
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState("");

  // Dedicated WhatsApp Routing States
  const [isWhatsAppDropdownOpen, setIsWhatsAppDropdownOpen] = useState(false);
  const [whatsappMasterInput, setWhatsappMasterInput] = useState("");
  const [whatsappCardInput, setWhatsappCardInput] = useState("");
  const [whatsappFooterInput, setWhatsappFooterInput] = useState("");
  const [whatsappPdpInput, setWhatsappPdpInput] = useState("");
  const [whatsappQuotationInput, setWhatsappQuotationInput] = useState("");
  const [whatsappDispatchInput, setWhatsappDispatchInput] = useState("");
  const [whatsappSavedMsg, setWhatsappSavedMsg] = useState("");
  const [whatsappAppliedMsg, setWhatsappAppliedMsg] = useState("");
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);

  // Homepage Highlight Cards State (Rename & Custom URL)
  const [homeCard1Title, setHomeCard1Title] = useState(settings.home_card1_title || "Zero Wire Slicing");
  const [homeCard1Sub, setHomeCard1Sub] = useState(settings.home_card1_subtitle || "100% OEM Couplers");
  const [homeCard1Url, setHomeCard1Url] = useState(settings.home_card1_url || "");

  const [homeCard2Title, setHomeCard2Title] = useState(settings.home_card2_title || "Warranty Protected");
  const [homeCard2Sub, setHomeCard2Sub] = useState(settings.home_card2_subtitle || "Verify Certificate →");
  const [homeCard2Url, setHomeCard2Url] = useState(settings.home_card2_url || "/warranty");

  const [homeCard3Title, setHomeCard3Title] = useState(settings.home_card3_title || "WhatsApp Chat");
  const [homeCard3Sub, setHomeCard3Sub] = useState(settings.home_card3_subtitle || "Direct Chat →");
  const [homeCard3Url, setHomeCard3Url] = useState(settings.home_card3_url || "");

  const [homeCard4Title, setHomeCard4Title] = useState(settings.home_card4_title || "Store Locator");
  const [homeCard4Sub, setHomeCard4Sub] = useState(settings.home_card4_subtitle || "Google Maps →");
  const [homeCard4Url, setHomeCard4Url] = useState(settings.home_card4_url || "");

  const [savingHomeCards, setSavingHomeCards] = useState(false);
  const [homeCardsSavedMsg, setHomeCardsSavedMsg] = useState("");

  // Default Fallback Banner Form State (Pre-populated defaults)
  const DEFAULT_BANNER_CONFIG = {
    title1: "ELEVATE YOUR CAR WITH",
    title2: "CUSTOM ACCESSORIES",
    subtitle: "Discover custom 7D floor mats, Nappa leatherette seat covers, app-controlled ambient lighting, 4K dual-lens dash cams, and off-road enhancements engineered to fit your exact vehicle model.",
    ctaText: "EXPLORE BRANDS",
    imageUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1920&auto=format&fit=crop",
    imageUrlLight: "",
  };

  const [defaultBannerForm, setDefaultBannerForm] = useState(DEFAULT_BANNER_CONFIG);
  const [defaultBannerPreviewTheme, setDefaultBannerPreviewTheme] = useState<"dark" | "light">("light");
  const [uploadingDefaultBannerImage, setUploadingDefaultBannerImage] = useState(false);
  const [uploadingDefaultBannerLightImage, setUploadingDefaultBannerLightImage] = useState(false);
  const [defaultBannerSavedMsg, setDefaultBannerSavedMsg] = useState("");

  // -------------------------------------------------------------
  // Telegram CDN & Media Uploader States
  // -------------------------------------------------------------
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [tgBotToken, setTgBotToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [tgStatus, setTgStatus] = useState<{
    configured: boolean;
    ok?: boolean;
    botName?: string;
    username?: string;
    error?: string;
    chatId?: string;
  } | null>(null);
  const [testingTg, setTestingTg] = useState(false);
  const [tgMsg, setTgMsg] = useState("");
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Check existing session via secure HttpOnly cookie verification
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setIsAuthenticated(true);
            setAuthRole(data.user.role || "admin");
            setActiveTab("enquiries");
            fetchAllData();
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.warn("Session verification error:", err);
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          mode: "admin",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAuthRole("admin");
        setActiveTab("enquiries");
        setAuthError("");
        showToastNotice("Authenticated as Full Studio Admin", "success");
        fetchAllData();
      } else {
        setAuthError(data.error || "Invalid admin credentials. Access restricted.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Login request failed");
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: staffPasswordInput,
          mode: "staff",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAuthRole("staff");
        setActiveTab("enquiries");
        setAuthError("");
        showToastNotice("Authenticated as Studio Staff", "success");
        fetchAllData();
      } else {
        setAuthError(data.error || "Invalid staff password. Access restricted.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Staff login request failed");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setIsAuthenticated(false);
    sessionStorage.removeItem("cars9_admin_session");
    sessionStorage.removeItem("cars9_role");
    showToastNotice("Signed out of studio portal", "info");
  };

  const switchToFullAdmin = () => {
    handleLogout();
    setLoginMode("admin");
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resBanners, resParts, resRecycle, resBrands, resQuotes, resWarranties] = await Promise.all([
        fetch("/api/banners?all=true"),
        fetch("/api/parts"),
        fetch("/api/parts?onlyDeleted=true"),
        fetch("/api/brands?includeDeleted=true"),
        fetch("/api/quotations"),
        fetch("/api/warranties"),
      ]);

      if (resBanners.ok) setBanners(await resBanners.json());
      if (resParts.ok) setProducts(await resParts.json());
      if (resRecycle.ok) setRecycleBin(await resRecycle.json());
      if (resBrands.ok) setBrands(await resBrands.json());
      if (resQuotes.ok) setEnquiries(await resQuotes.json());
      if (resWarranties.ok) setWarranties(await resWarranties.json());
      fetchTelegramStatus();
    } catch (err) {
      console.error("Error fetching admin data", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 1. BANNER HANDLERS
  // =========================================================================
  const handleToggleBanner = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: newStatus } : b))
    );

    try {
      await fetch(`/api/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
    } catch (err) {
      console.error("Failed to toggle banner", err);
    }
  };

  const handleSaveBanner = async (banner: Banner) => {
    try {
      if (banner.id) {
        await fetch(`/api/banners/${banner.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(banner),
        });
        setBanners((prev) => prev.map((b) => (b.id === banner.id ? banner : b)));
      } else {
        const res = await fetch(`/api/banners`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(banner),
        });
        if (res.ok) {
          const created = await res.json();
          setBanners((prev) => [...prev, created]);
        }
      }
      setEditingBanner(null);
    } catch (err) {
      console.error("Failed to save banner", err);
    }
  };

  // =========================================================================
  // 2. INLINE BRAND & MODEL CREATION IN PRODUCT MODAL
  // =========================================================================
  const handleInlineSaveBrand = async () => {
    if (!inlineBrandName.trim()) return;
    const name = inlineBrandName.trim();
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "brand", name }),
      });
      if (res.ok) {
        const newB = { id, name, logo: null, subbrands: [], isDeleted: false, deletedAt: null };
        setBrands((prev) => {
          const exists = prev.some((b) => b.id === id || b.name.toLowerCase().trim() === name.toLowerCase());
          if (exists) {
            return prev.map((b) =>
              b.id === id || b.name.toLowerCase().trim() === name.toLowerCase()
                ? { ...b, isDeleted: false, deletedAt: null }
                : b
            );
          }
          return [...prev, newB];
        });
        setProductForm((prev) => ({ ...prev, brand: name, subbrand: "" }));
        setInlineBrandName("");
        setInlineNewBrand(false);
        showToastNotice(`Brand "${name}" added!`, "success");
      }
    } catch (err) {
      console.error("Failed to add brand", err);
    }
  };

  const handleInlineSaveModel = async () => {
    if (!inlineModelName.trim() || !productForm.brand) return;
    const modelName = inlineModelName.trim();
    const currentBrandObj = brands.find(
      (b) => b.name.trim().toLowerCase() === productForm.brand.trim().toLowerCase()
    );
    if (!currentBrandObj) return;

    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subbrand",
          brandId: currentBrandObj.id,
          name: modelName,
          years: COMMON_YEARS,
        }),
      });
      if (res.ok) {
        const newSub = { name: modelName, years: COMMON_YEARS, isDeleted: false, deletedAt: null };
        setBrands((prev) =>
          prev.map((b) => {
            const isMatch = b.id === currentBrandObj.id || b.name.trim().toLowerCase() === currentBrandObj.name.trim().toLowerCase();
            if (!isMatch) return b;
            const existing = b.subbrands || [];
            const exists = existing.some((s: any) => (typeof s === "string" ? s : s.name).trim().toLowerCase() === modelName.toLowerCase());
            return {
              ...b,
              subbrands: exists
                ? existing.map((s: any) =>
                    (typeof s === "string" ? s : s.name).trim().toLowerCase() === modelName.toLowerCase()
                      ? { ...(typeof s === "string" ? { name: s } : s), isDeleted: false, deletedAt: null }
                      : s
                  )
                : [...existing, newSub],
            };
          })
        );
        setProductForm((prev) => ({ ...prev, subbrand: modelName }));
        setInlineModelName("");
        setInlineNewModel(false);
        showToastNotice(`Model "${modelName}" added and selected for ${productForm.brand}!`, "success");
      }
    } catch (err) {
      console.error("Failed to add model", err);
    }
  };

  // -------------------------------------------------------------
  // Brands & Models Architecture Management Handlers
  // -------------------------------------------------------------
  const handleCreateBrand = async (name: string, logo: string) => {
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "brand", name: name.trim(), logo: logo || null }),
      });
      if (res.ok) {
        const newB = await res.json();
        setBrands((prev) => [...prev, newB]);
        setShowAddBrandModal(false);
        setNewBrandForm({ name: "", logo: "" });
        setToastNotice({ text: `Brand "${name}" added successfully!`, type: "success" });
      }
    } catch (e) {
      console.error("Failed to create brand", e);
    }
  };

  // Soft Delete Brand -> Moves to Recycle Bin
  const handleSoftDeleteBrand = async (brandId: string, brandName: string) => {
    try {
      const res = await fetch(`/api/brands/${brandId}`, { method: "DELETE" });
      if (res.ok) {
        const now = new Date().toISOString();
        setBrands((prev) =>
          prev.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  isDeleted: true,
                  deletedAt: now,
                  subbrands: (b.subbrands || []).map((s) => ({ ...s, isDeleted: true, deletedAt: now })),
                }
              : b
          )
        );
        if (selectedBrandForModels?.id === brandId) {
          setSelectedBrandForModels(null);
        }
        setToastNotice({ text: `Brand "${brandName}" moved to Recycle Bin`, type: "info" });
      }
    } catch (e) {
      console.error("Failed to soft-delete brand", e);
    }
  };

  // Restore Brand from Recycle Bin
  const handleRestoreBrand = async (brandId: string, brandName: string) => {
    try {
      const res = await fetch(`/api/brands/${brandId}/restore`, { method: "POST" });
      if (res.ok) {
        setBrands((prev) =>
          prev.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  isDeleted: false,
                  deletedAt: null,
                  subbrands: (b.subbrands || []).map((s) => ({ ...s, isDeleted: false, deletedAt: null })),
                }
              : b
          )
        );
        setToastNotice({ text: `Brand "${brandName}" restored to Active!`, type: "success" });
      }
    } catch (e) {
      console.error("Failed to restore brand", e);
    }
  };

  // Permanent Delete Brand
  const handlePermanentDeleteBrand = async (brandId: string, brandName: string) => {
    if (!confirm(`Permanently erase brand "${brandName}" and all associated models? This CANNOT be undone.`)) return;
    try {
      const res = await fetch(`/api/brands/${brandId}?permanent=true`, { method: "DELETE" });
      if (res.ok) {
        setBrands((prev) => prev.filter((b) => b.id !== brandId));
        if (selectedBrandForModels?.id === brandId) {
          setSelectedBrandForModels(null);
        }
        setToastNotice({ text: `Brand "${brandName}" permanently deleted`, type: "info" });
      }
    } catch (e) {
      console.error("Failed to permanently delete brand", e);
    }
  };

  // Soft Delete Model -> Moves to Recycle Bin
  const handleSoftDeleteModel = async (brandId: string, modelName: string) => {
    try {
      const res = await fetch(`/api/brands/${brandId}/subbrands/${encodeURIComponent(modelName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const now = new Date().toISOString();
        setBrands((prev) =>
          prev.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  subbrands: (b.subbrands || []).map((s) =>
                    s.name.toLowerCase() === modelName.toLowerCase()
                      ? { ...s, isDeleted: true, deletedAt: now }
                      : s
                  ),
                }
              : b
          )
        );
        setSelectedBrandForModels((prev) => {
          if (!prev || prev.id !== brandId) return prev;
          return {
            ...prev,
            subbrands: (prev.subbrands || []).map((s) =>
              s.name.toLowerCase() === modelName.toLowerCase()
                ? { ...s, isDeleted: true, deletedAt: now }
                : s
            ),
          };
        });
        setToastNotice({ text: `Model "${modelName}" moved to Recycle Bin`, type: "info" });
      }
    } catch (e) {
      console.error("Failed to soft-delete model", e);
    }
  };

  // Restore Model from Recycle Bin
  const handleRestoreModel = async (brandId: string, modelName: string) => {
    try {
      const res = await fetch(`/api/brands/${brandId}/subbrands/${encodeURIComponent(modelName)}/restore`, {
        method: "POST",
      });
      if (res.ok) {
        setBrands((prev) =>
          prev.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  isDeleted: false,
                  deletedAt: null,
                  subbrands: (b.subbrands || []).map((s) =>
                    s.name.toLowerCase() === modelName.toLowerCase()
                      ? { ...s, isDeleted: false, deletedAt: null }
                      : s
                  ),
                }
              : b
          )
        );
        setSelectedBrandForModels((prev) => {
          if (!prev || prev.id !== brandId) return prev;
          return {
            ...prev,
            subbrands: (prev.subbrands || []).map((s) =>
              s.name.toLowerCase() === modelName.toLowerCase()
                ? { ...s, isDeleted: false, deletedAt: null }
                : s
            ),
          };
        });
        setToastNotice({ text: `Model "${modelName}" restored to Active!`, type: "success" });
      }
    } catch (e) {
      console.error("Failed to restore model", e);
    }
  };

  // Permanent Delete Model
  const handlePermanentDeleteModel = async (brandId: string, modelName: string) => {
    if (!confirm(`Permanently erase model "${modelName}" from database? This CANNOT be undone.`)) return;
    try {
      const res = await fetch(`/api/brands/${brandId}/subbrands/${encodeURIComponent(modelName)}?permanent=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBrands((prev) =>
          prev.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  subbrands: (b.subbrands || []).filter((s) => s.name.toLowerCase() !== modelName.toLowerCase()),
                }
              : b
          )
        );
        setSelectedBrandForModels((prev) => {
          if (!prev || prev.id !== brandId) return prev;
          return {
            ...prev,
            subbrands: (prev.subbrands || []).filter((s) => s.name.toLowerCase() !== modelName.toLowerCase()),
          };
        });
        setToastNotice({ text: `Model "${modelName}" permanently deleted`, type: "info" });
      }
    } catch (e) {
      console.error("Failed to permanently delete model", e);
    }
  };

  // Empty Brands & Models Recycle Bin
  const handleEmptyBrandRecycleBin = async () => {
    if (!confirm("Are you sure you want to permanently erase ALL deleted brands and models in the recycle bin?")) return;
    try {
      const deletedB = brands.filter((b) => b.isDeleted);
      for (const b of deletedB) {
        await fetch(`/api/brands/${b.id}?permanent=true`, { method: "DELETE" });
      }
      for (const b of brands) {
        if (!b.isDeleted) {
          const deletedM = (b.subbrands || []).filter((s) => s.isDeleted);
          for (const m of deletedM) {
            await fetch(`/api/brands/${b.id}/subbrands/${encodeURIComponent(m.name)}?permanent=true`, { method: "DELETE" });
          }
        }
      }
      setBrands((prev) =>
        prev
          .filter((b) => !b.isDeleted)
          .map((b) => ({
            ...b,
            subbrands: (b.subbrands || []).filter((s) => !s.isDeleted),
          }))
      );
      setToastNotice({ text: "Vehicle recycle bin emptied successfully", type: "info" });
    } catch (e) {
      console.error("Failed to empty vehicle recycle bin", e);
    }
  };

  const handleSaveBrandLogo = async (brandId: string, logo: string) => {
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo }),
      });
      if (res.ok) {
        setBrands((prev) =>
          prev.map((b) => (b.id === brandId ? { ...b, logo } : b))
        );
        if (selectedBrandForModels?.id === brandId) {
          setSelectedBrandForModels((prev) => (prev ? { ...prev, logo } : null));
        }
        setEditingBrandLogo(null);
        setToastNotice({ text: "Brand logo updated!", type: "success" });
      }
    } catch (e) {
      console.error("Failed to update logo", e);
    }
  };

  const handleCreateModel = async (brandId: string, modelName: string, imageUrl: string, years: string[]) => {
    if (!modelName.trim()) return;
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subbrand",
          brandId,
          name: modelName.trim(),
          imageUrl: imageUrl || null,
          years: years && years.length > 0 ? years : COMMON_YEARS,
        }),
      });
      if (res.ok) {
        const newSub = { name: modelName.trim(), imageUrl: imageUrl || null, years: years || COMMON_YEARS };
        setBrands((prev) =>
          prev.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  subbrands: [
                    ...(b.subbrands || []),
                    newSub,
                  ],
                }
              : b
          )
        );
        setSelectedBrandForModels((prev) => {
          if (!prev || prev.id !== brandId) return prev;
          return {
            ...prev,
            subbrands: [
              ...(prev.subbrands || []),
              newSub,
            ],
          };
        });
        setShowAddModelModal(false);
        setNewModelForm({ name: "", imageUrl: "", years: COMMON_YEARS });
        setToastNotice({ text: `Model "${modelName}" added successfully!`, type: "success" });
      }
    } catch (e) {
      console.error("Failed to add model", e);
    }
  };

  const handleDeleteModel = handleSoftDeleteModel;

  const handleSaveModelPhoto = async (brandId: string, modelName: string, imageUrl: string) => {
    try {
      const res = await fetch(`/api/brands/${brandId}/subbrands/${encodeURIComponent(modelName)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (res.ok) {
        setBrands((prev) =>
          prev.map((b) =>
            b.id === brandId
              ? {
                  ...b,
                  subbrands: (b.subbrands || []).map((s) =>
                    s.name.toLowerCase() === modelName.toLowerCase() ? { ...s, imageUrl } : s
                  ),
                }
              : b
          )
        );
        setSelectedBrandForModels((prev) => {
          if (!prev || prev.id !== brandId) return prev;
          return {
            ...prev,
            subbrands: (prev.subbrands || []).map((s) =>
              s.name.toLowerCase() === modelName.toLowerCase() ? { ...s, imageUrl } : s
            ),
          };
        });
        setEditingModelPhoto(null);
        setToastNotice({ text: `Photo updated for ${modelName}!`, type: "success" });
      }
    } catch (e) {
      console.error("Failed to update model photo", e);
    }
  };

  // -------------------------------------------------------------
  // Brand Display Order & Homepage Arrangement Handlers
  // -------------------------------------------------------------
  const handleSetBrandFirst = async (brandId: string, brandName: string) => {
    try {
      const targetBrand = activeBrands.find((b) => b.id === brandId);
      if (!targetBrand) return;

      const otherBrands = activeBrands.filter((b) => b.id !== brandId);
      const reordered = [targetBrand, ...otherBrands];
      const newOrderIds = reordered.map((b) => b.id);

      // Immediately update local brands with new rank
      setBrands((prev) => {
        return prev.map((b) => {
          const idx = newOrderIds.indexOf(b.id);
          return idx !== -1 ? { ...b, rank: idx } : b;
        });
      });

      // Persist to backend
      await Promise.all([
        fetch("/api/brands/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandIds: newOrderIds }),
        }),
        updateSetting("brand_order", newOrderIds),
      ]);

      showToastNotice(`"${brandName}" is now set to 1st place on the Homepage!`, "success");
    } catch (err: any) {
      alert("Failed to update brand order: " + err.message);
    }
  };

  const handleMoveBrand = async (brandId: string, direction: "up" | "down") => {
    try {
      const idx = activeBrands.findIndex((b) => b.id === brandId);
      if (idx === -1) return;
      if (direction === "up" && idx === 0) return;
      if (direction === "down" && idx === activeBrands.length - 1) return;

      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      const reordered = [...activeBrands];
      const temp = reordered[idx];
      reordered[idx] = reordered[targetIdx];
      reordered[targetIdx] = temp;

      const newOrderIds = reordered.map((b) => b.id);

      // Immediately update local brands with new rank
      setBrands((prev) => {
        return prev.map((b) => {
          const newRank = newOrderIds.indexOf(b.id);
          return newRank !== -1 ? { ...b, rank: newRank } : b;
        });
      });

      // Persist to backend
      await Promise.all([
        fetch("/api/brands/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandIds: newOrderIds }),
        }),
        updateSetting("brand_order", newOrderIds),
      ]);

      showToastNotice("Brand display order updated successfully!", "success");
    } catch (err: any) {
      alert("Failed to move brand: " + err.message);
    }
  };

  const handleSetBrandPosition = async (brandId: string, newPositionOneBased: number) => {
    try {
      const newPos = newPositionOneBased - 1;
      const currentIdx = activeBrands.findIndex((b) => b.id === brandId);
      if (currentIdx === -1 || currentIdx === newPos) return;

      const reordered = [...activeBrands];
      const [item] = reordered.splice(currentIdx, 1);
      reordered.splice(newPos, 0, item);

      const newOrderIds = reordered.map((b) => b.id);

      setBrands((prev) => {
        return prev.map((b) => {
          const newRank = newOrderIds.indexOf(b.id);
          return newRank !== -1 ? { ...b, rank: newRank } : b;
        });
      });

      await Promise.all([
        fetch("/api/brands/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandIds: newOrderIds }),
        }),
        updateSetting("brand_order", newOrderIds),
      ]);

      showToastNotice(`Brand position updated to #${newPositionOneBased}!`, "success");
    } catch (err: any) {
      alert("Failed to update brand position: " + err.message);
    }
  };

  const handleResetBrandOrderAlphabetical = async () => {
    try {
      const alphaSorted = [...activeBrands].sort((a, b) => a.name.localeCompare(b.name));
      const newOrderIds = alphaSorted.map((b) => b.id);

      setBrands((prev) => {
        return prev.map((b) => {
          const newRank = newOrderIds.indexOf(b.id);
          return newRank !== -1 ? { ...b, rank: newRank } : b;
        });
      });

      await Promise.all([
        fetch("/api/brands/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandIds: newOrderIds }),
        }),
        updateSetting("brand_order", newOrderIds),
      ]);

      showToastNotice("Brands reset to alphabetical order (A-Z)!", "info");
    } catch (err: any) {
      alert("Failed to reset brand order: " + err.message);
    }
  };

  const uploadFileToTelegram = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        return data.url;
      } else {
        alert("Upload error: " + (data.error || "Failed to upload image"));
        return null;
      }
    } catch (err: any) {
      alert("Network upload error: " + err.message);
      return null;
    }
  };

  const availableModelsForSelectedBrand = useMemo(() => {
    const b = brands.find((brand) => brand.name.trim().toLowerCase() === productForm.brand.trim().toLowerCase());
    if (!b || !Array.isArray(b.subbrands)) return [];
    return b.subbrands
      .filter((s: any) => !s.isDeleted)
      .map((s: any) => (typeof s === "string" ? s : s.name));
  }, [brands, productForm.brand]);

  const allAvailableYears = useMemo(() => {
    const set = new Set<string>(COMMON_YEARS);
    customYears.forEach((y) => set.add(y));
    (productForm.compatibleYears || []).forEach((y) => set.add(y));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [customYears, productForm.compatibleYears]);

  const handleAddCustomYear = () => {
    const cleaned = newYearInput.trim();
    if (!cleaned) return;
    if (!customYears.includes(cleaned)) {
      setCustomYears((prev) => [...prev, cleaned]);
    }
    if (!productForm.compatibleYears.includes(cleaned)) {
      setProductForm((prev) => ({
        ...prev,
        compatibleYears: [...prev.compatibleYears, cleaned].sort((a, b) => Number(b) - Number(a)),
      }));
    }
    setNewYearInput("");
    setShowAddYearInput(false);
    setToastNotice({ text: `Year "${cleaned}" added and selected!`, type: "success" });
  };

  const handleInlineSaveCategory = () => {
    const trimmed = inlineCategoryName.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      setCustomCategories((prev) => [...prev, trimmed]);
    }
    setProductForm((prev) => ({ ...prev, category: trimmed }));
    setInlineCategoryName("");
    setInlineNewCategory(false);
    setToastNotice({ text: `Category "${trimmed}" added!`, type: "success" });
  };

  const allCategoryOptions = useMemo(() => {
    const DEFAULT_CATEGORIES = [
      "Infotainment & Audio",
      "Lighting & Electrical",
      "Interior Styling",
      "Exterior Styling",
      "Car Care & Utility"
    ];
    const set = new Set<string>(DEFAULT_CATEGORIES);
    products.forEach((p) => { if (p.category) set.add(p.category); });
    recycleBin.forEach((p) => { if (p.category) set.add(p.category); });
    customCategories.forEach((c) => set.add(c));
    if (productForm.category) set.add(productForm.category);
    return Array.from(set);
  }, [products, recycleBin, customCategories, productForm.category]);

  const toggleYear = (yr: string) => {
    setProductForm((prev) => {
      const exists = prev.compatibleYears.includes(yr);
      const nextYears = exists
        ? prev.compatibleYears.filter((y) => y !== yr)
        : [...prev.compatibleYears, yr].sort((a, b) => Number(b) - Number(a));
      return { ...prev, compatibleYears: nextYears };
    });
  };

  const handleSelectAllYears = () => {
    setProductForm((prev) => ({ ...prev, compatibleYears: [...allAvailableYears] }));
  };

  const handleClearYears = () => {
    setProductForm((prev) => ({ ...prev, compatibleYears: [] }));
  };

  const handleAdjustStock = async (partId: string, delta: number) => {
    const part = products.find((p) => p.id === partId);
    if (!part) return;
    const newStock = Math.max(0, part.stock + delta);

    setProducts((prev) =>
      prev.map((p) => (p.id === partId ? { ...p, stock: newStock } : p))
    );

    try {
      await fetch(`/api/parts/${partId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
    } catch (err) {
      console.error("Failed to adjust stock", err);
    }
  };

  const showToastNotice = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastNotice({ text, type });
    setTimeout(() => {
      setToastNotice((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Trigger Delete on Active Catalog Part -> Opens Cancel/Confirm Alert Dialog
  const triggerDeletePart = (part: CarPart) => {
    setDeleteModal({
      isOpen: true,
      part,
      isPermanent: false,
      mode: "single",
      title: "Move Accessory to Recycle Bin?",
      description: `Are you sure you want to delete "${part.name}" (${part.sku})? It will be removed from the active storefront catalog and moved to the Recycle Bin. You will have a 5-second quick recovery button, and it can always be restored anytime.`,
    });
  };

  const handleDeletePart = (id: string, name: string) => {
    const part = products.find((p) => p.id === id);
    if (part) {
      triggerDeletePart(part);
    }
  };

  // Execute Soft Delete (After user clicks Confirm in the alert dialog)
  const executeSoftDelete = async (part: CarPart) => {
    setDeleteModal({ isOpen: false });
    try {
      const res = await fetch(`/api/parts/${part.id}`, { method: "DELETE" });
      if (res.ok) {
        // Remove from active products
        setProducts((prev) => prev.filter((p) => p.id !== part.id));
        // Add to recycle bin
        const deletedPart = { ...part, isDeleted: true, deletedAt: new Date().toISOString() };
        setRecycleBin((prev) => [deletedPart, ...prev.filter((p) => p.id !== part.id)]);

        // Start 5-second countdown timer for Undo
        if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        setUndoItem(deletedPart);
        setUndoCountdown(5);

        let currentCount = 5;
        undoTimerRef.current = setInterval(() => {
          currentCount -= 1;
          setUndoCountdown(currentCount);
          if (currentCount <= 0) {
            if (undoTimerRef.current) clearInterval(undoTimerRef.current);
            undoTimerRef.current = null;
            setTimeout(() => {
              setUndoItem((prev) => (prev?.id === part.id ? null : prev));
            }, 600);
          }
        }, 1000);
      } else {
        showToastNotice("Failed to delete accessory", "error");
      }
    } catch (err) {
      console.error("Failed to delete part", err);
      showToastNotice("Error deleting accessory", "error");
    }
  };

  // Recover / Undo Action (Within 5 seconds)
  const handleUndoDelete = async () => {
    if (!undoItem) return;
    if (undoTimerRef.current) {
      clearInterval(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const itemToRestore = undoItem;
    setUndoItem(null);

    try {
      const res = await fetch(`/api/parts/${itemToRestore.id}/restore`, { method: "POST" });
      if (res.ok) {
        setRecycleBin((prev) => prev.filter((p) => p.id !== itemToRestore.id));
        setProducts((prev) => [{ ...itemToRestore, isDeleted: false, deletedAt: undefined }, ...prev.filter((p) => p.id !== itemToRestore.id)]);
        showToastNotice(`Recovered "${itemToRestore.name}" successfully!`, "success");
      } else {
        showToastNotice("Failed to restore item", "error");
      }
    } catch (err) {
      console.error("Failed to restore item", err);
      showToastNotice("Error recovering item", "error");
    }
  };

  // Restore individual item from Recycle Bin
  const handleRestoreFromRecycleBin = async (part: CarPart) => {
    try {
      const res = await fetch(`/api/parts/${part.id}/restore`, { method: "POST" });
      if (res.ok) {
        setRecycleBin((prev) => prev.filter((p) => p.id !== part.id));
        setSelectedRecycleIds((prev) => prev.filter((id) => id !== part.id));
        setProducts((prev) => [{ ...part, isDeleted: false, deletedAt: undefined }, ...prev.filter((p) => p.id !== part.id)]);
        showToastNotice(`Restored "${part.name}" to catalog!`, "success");
      } else {
        showToastNotice("Failed to restore accessory", "error");
      }
    } catch (err) {
      console.error("Failed to restore part", err);
      showToastNotice("Error restoring accessory", "error");
    }
  };

  // Bulk restore selected from Recycle Bin
  const handleBulkRestoreSelected = async () => {
    if (selectedRecycleIds.length === 0) return;
    try {
      const res = await fetch("/api/parts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", ids: selectedRecycleIds }),
      });
      if (res.ok) {
        const restoredParts = recycleBin.filter((p) => selectedRecycleIds.includes(p.id));
        setRecycleBin((prev) => prev.filter((p) => !selectedRecycleIds.includes(p.id)));
        setProducts((prev) => [
          ...restoredParts.map((p) => ({ ...p, isDeleted: false, deletedAt: undefined })),
          ...prev.filter((p) => !selectedRecycleIds.includes(p.id)),
        ]);
        showToastNotice(`Restored ${selectedRecycleIds.length} accessories to catalog!`, "success");
        setSelectedRecycleIds([]);
      }
    } catch (err) {
      console.error("Failed bulk restore", err);
      showToastNotice("Error during bulk restore", "error");
    }
  };

  // Bulk restore all filtered from Recycle Bin
  const handleBulkRestoreFiltered = async () => {
    const idsToRestore = filteredRecycleBin.map((p) => p.id);
    if (idsToRestore.length === 0) return;
    try {
      const res = await fetch("/api/parts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", ids: idsToRestore }),
      });
      if (res.ok) {
        const restoredParts = recycleBin.filter((p) => idsToRestore.includes(p.id));
        setRecycleBin((prev) => prev.filter((p) => !idsToRestore.includes(p.id)));
        setProducts((prev) => [
          ...restoredParts.map((p) => ({ ...p, isDeleted: false, deletedAt: undefined })),
          ...prev.filter((p) => !idsToRestore.includes(p.id)),
        ]);
        showToastNotice(`Restored ${idsToRestore.length} accessories to catalog!`, "success");
        setSelectedRecycleIds((prev) => prev.filter((id) => !idsToRestore.includes(id)));
      }
    } catch (err) {
      console.error("Failed restore filtered", err);
      showToastNotice("Error during restore", "error");
    }
  };

  // Permanent Delete Trigger -> Opens Alert Dialog
  const triggerPermanentDelete = (part: CarPart) => {
    setDeleteModal({
      isOpen: true,
      part,
      isPermanent: true,
      mode: "single",
      title: "Permanently Erase Accessory?",
      description: `Are you sure you want to permanently erase "${part.name}" (${part.sku}) from the database? This action CANNOT be undone and will not be recoverable.`,
    });
  };

  // Trigger Bulk Selected Permanent Delete
  const triggerBulkDeleteSelected = () => {
    if (selectedRecycleIds.length === 0) return;
    setDeleteModal({
      isOpen: true,
      isPermanent: true,
      mode: "bulk_selected",
      count: selectedRecycleIds.length,
      title: `Permanently Erase ${selectedRecycleIds.length} Selected Accessories?`,
      description: `This will permanently delete the ${selectedRecycleIds.length} selected accessories from the database. This action CANNOT be reversed.`,
    });
  };

  // Trigger Delete Filter-wise Permanent Delete
  const triggerDeleteFiltered = () => {
    if (filteredRecycleBin.length === 0) return;
    setDeleteModal({
      isOpen: true,
      isPermanent: true,
      mode: "bulk_filtered",
      count: filteredRecycleBin.length,
      title: `Permanently Erase ${filteredRecycleBin.length} Filtered Accessories?`,
      description: `This will permanently erase all ${filteredRecycleBin.length} accessories matching current search and filters from the database. This action CANNOT be reversed.`,
    });
  };

  // Trigger Empty Recycle Bin (Delete All)
  const triggerEmptyRecycleBin = () => {
    if (recycleBin.length === 0) return;
    setDeleteModal({
      isOpen: true,
      isPermanent: true,
      mode: "empty_all",
      count: recycleBin.length,
      title: "Empty Entire Recycle Bin?",
      description: `Are you sure you want to permanently erase ALL ${recycleBin.length} accessories in the Recycle Bin? All deleted items will be purged forever from the database.`,
    });
  };

  // Execute Permanent Delete (After Confirm in Dialog)
  const executePermanentDelete = async () => {
    const { mode, part } = deleteModal;
    setDeleteModal({ isOpen: false });

    try {
      if (mode === "single" && part) {
        const res = await fetch(`/api/parts/${part.id}?permanent=true`, { method: "DELETE" });
        if (res.ok) {
          setRecycleBin((prev) => prev.filter((p) => p.id !== part.id));
          setSelectedRecycleIds((prev) => prev.filter((id) => id !== part.id));
          showToastNotice(`Permanently erased "${part.name}"`, "info");
        } else {
          showToastNotice("Failed to erase accessory", "error");
        }
      } else if (mode === "bulk_selected") {
        const res = await fetch("/api/parts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedRecycleIds }),
        });
        if (res.ok) {
          setRecycleBin((prev) => prev.filter((p) => !selectedRecycleIds.includes(p.id)));
          showToastNotice(`Permanently erased ${selectedRecycleIds.length} accessories`, "info");
          setSelectedRecycleIds([]);
        }
      } else if (mode === "bulk_filtered") {
        const idsToDelete = filteredRecycleBin.map((p) => p.id);
        const res = await fetch("/api/parts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: idsToDelete }),
        });
        if (res.ok) {
          setRecycleBin((prev) => prev.filter((p) => !idsToDelete.includes(p.id)));
          setSelectedRecycleIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
          showToastNotice(`Permanently erased ${idsToDelete.length} filtered accessories`, "info");
        }
      } else if (mode === "empty_all") {
        const res = await fetch("/api/parts?all=true", { method: "DELETE" });
        if (res.ok) {
          setRecycleBin([]);
          setSelectedRecycleIds([]);
          showToastNotice("Recycle bin emptied successfully", "info");
        }
      }
    } catch (err) {
      console.error("Failed permanent delete", err);
      showToastNotice("Error erasing items", "error");
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    const defaultBrand = brands[0]?.name || "Toyota";
    const defaultModels = brands[0]?.subbrands || [];
    const firstModel = defaultModels[0]
      ? typeof defaultModels[0] === "string"
        ? defaultModels[0]
        : defaultModels[0].name
      : "Fortuner";

    setProductForm({
      name: "",
      brand: defaultBrand,
      subbrand: firstModel,
      category: "Infotainment & Audio",
      sku: `C9-${Math.floor(100 + Math.random() * 900)}`,
      description: "",
      price: 25000,
      stock: 10,
      location: "Studio Bay A-1",
      images: ["", "", "", "", ""],
      videoUrl: "",
      compatibleYears: ["2024", "2023", "2022", "2021", "2020"],
      badge: "OEM Coupler",
      warrantyValue: 12,
      warrantyUnit: "months" as "days" | "months" | "years",
      warrantyMonths: 12,
      bayTime: "60–90 Mins Bay Time",
      whatsInBox: "1x Main Unit, 1x OEM Coupler Harness, 1x Studio Warranty Card",
      installationGuide: "100% Plug-and-play coupler mating into factory sockets. Zero wire splicing required.",
      specs: "Wiring: OEM Plug & Play\nWarranty: 1 Year\nScreen: IPS Anti-Glare",
      oemNumber: "",
      material: "",
      dimensions: "",
      weight: "",
    });
    setInlineNewBrand(false);
    setInlineNewModel(false);
    setInlineNewCategory(false);
    setShowAddYearInput(false);
    setShowProductModal(true);
  };

  const openEditProductModal = (part: CarPart) => {
    setEditingProduct(part);
    const existingImages = part.images && part.images.length > 0 ? part.images : [part.imageUrl || ""];
    while (existingImages.length < 5) existingImages.push("");

    const yearList = Array.isArray(part.compatibleYears)
      ? part.compatibleYears
      : ["2024", "2023", "2022"];

    let initialWarrantyVal = 12;
    let initialWarrantyUnit: "days" | "months" | "years" = "months";

    if (part.specifications?.["Warranty Value"] && part.specifications?.["Warranty Unit"]) {
      initialWarrantyVal = Number(part.specifications["Warranty Value"]) || 1;
      initialWarrantyUnit = part.specifications["Warranty Unit"] as "days" | "months" | "years";
    } else if (part.warrantyMonths) {
      if (part.warrantyMonths % 12 === 0 && part.warrantyMonths >= 12) {
        initialWarrantyVal = part.warrantyMonths / 12;
        initialWarrantyUnit = "years";
      } else {
        initialWarrantyVal = part.warrantyMonths;
        initialWarrantyUnit = "months";
      }
    }

    setProductForm({
      name: part.name,
      brand: part.brand,
      subbrand: part.subbrand,
      category: part.category,
      sku: part.sku,
      description: part.description,
      price: part.price,
      stock: part.stock,
      location: part.location,
      images: existingImages.slice(0, 5),
      videoUrl: part.videoUrl || "",
      compatibleYears: yearList,
      badge: part.badge || "OEM Coupler",
      warrantyValue: initialWarrantyVal,
      warrantyUnit: initialWarrantyUnit,
      warrantyMonths: part.warrantyMonths || 12,
      bayTime: part.specifications?.["Installation Slot"] || "60–90 Mins Bay Time",
      whatsInBox: part.specifications?.["In-The-Box"] || "1x Main Unit, 1x OEM Coupler Harness, 1x Studio Warranty Card",
      installationGuide: part.specifications?.["Installation Guide"] || "100% Plug-and-play coupler mating into factory sockets. Zero wire splicing required.",
      specs: part.specifications
        ? Object.entries(part.specifications)
            .filter(([k]) => !["In-The-Box", "Installation Guide", "Installation Slot", "OEM Number", "Material", "Dimensions", "Weight", "Warranty", "Warranty Value", "Warranty Unit"].includes(k))
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        : "",
      oemNumber: part.specifications?.oemNumber || part.specifications?.["OEM Number"] || "",
      material: part.specifications?.material || part.specifications?.["Material"] || "",
      dimensions: part.specifications?.dimensions || part.specifications?.["Dimensions"] || "",
      weight: part.specifications?.weight || part.specifications?.["Weight"] || "",
    });
    setInlineNewBrand(false);
    setInlineNewModel(false);
    setInlineNewCategory(false);
    setShowAddYearInput(false);
    setShowProductModal(true);
  };

  const handleSaveProductModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const specObj: Record<string, string> = {};
      if (productForm.specs) {
        productForm.specs.split("\n").forEach((line) => {
          const [k, v] = line.split(":");
          if (k && v) specObj[k.trim()] = v.trim();
        });
      }
      if (productForm.oemNumber) specObj["OEM Number"] = productForm.oemNumber;
      if (productForm.material) specObj["Material"] = productForm.material;
      if (productForm.dimensions) specObj["Dimensions"] = productForm.dimensions;
      if (productForm.weight) specObj["Weight"] = productForm.weight;
      if (productForm.bayTime) specObj["Installation Slot"] = productForm.bayTime;
      if (productForm.whatsInBox) specObj["In-The-Box"] = productForm.whatsInBox;
      if (productForm.installationGuide) specObj["Installation Guide"] = productForm.installationGuide;

      let calculatedMonths = Number(productForm.warrantyValue) || 1;
      if (productForm.warrantyUnit === "years") {
        calculatedMonths = (Number(productForm.warrantyValue) || 1) * 12;
      } else if (productForm.warrantyUnit === "days") {
        calculatedMonths = Math.max(1, Math.round((Number(productForm.warrantyValue) || 30) / 30));
      }

      const warrantyUnitLabel = productForm.warrantyUnit === "days"
        ? (Number(productForm.warrantyValue) === 1 ? "Day" : "Days")
        : productForm.warrantyUnit === "years"
        ? (Number(productForm.warrantyValue) === 1 ? "Year" : "Years")
        : (Number(productForm.warrantyValue) === 1 ? "Month" : "Months");

      specObj["Warranty"] = `${productForm.warrantyValue} ${warrantyUnitLabel}`;
      specObj["Warranty Value"] = String(productForm.warrantyValue);
      specObj["Warranty Unit"] = productForm.warrantyUnit;

      const validImages = productForm.images.filter((img) => img.trim().length > 0);
      const primaryImage = validImages[0] || "/images/placeholder.jpg";

      const payload = {
        name: productForm.name,
        brand: productForm.brand,
        subbrand: productForm.subbrand,
        category: productForm.category,
        sku: productForm.sku,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        location: productForm.location,
        imageUrl: primaryImage,
        images: validImages,
        videoUrl: productForm.videoUrl.trim(),
        compatibleYears: productForm.compatibleYears,
        badge: productForm.badge,
        warrantyMonths: calculatedMonths,
        specifications: specObj,
      };

      if (editingProduct) {
        await fetch(`/api/parts/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p))
        );
      } else {
        const res = await fetch("/api/parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setProducts((prev) => [created, ...prev]);
        }
      }
      setShowProductModal(false);
    } catch (err) {
      console.error("Failed to save product", err);
    }
  };

  const filteredInventory = useMemo(() => {
    return products.filter((p) => {
      const q = invSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.subbrand.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);

      const matchBrand = !selectedBrandFilter || p.brand.toLowerCase() === selectedBrandFilter.toLowerCase();
      const matchStock = !inStockOnly || p.stock > 0;

      return matchQ && matchBrand && matchStock;
    });
  }, [products, invSearch, selectedBrandFilter, inStockOnly]);

  const filteredRecycleBin = useMemo(() => {
    return recycleBin.filter((p) => {
      const q = recycleSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.subbrand.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);

      const matchBrand = !recycleBrandFilter || p.brand.toLowerCase() === recycleBrandFilter.toLowerCase();
      const matchCat = !recycleCategoryFilter || p.category.toLowerCase() === recycleCategoryFilter.toLowerCase();

      return matchQ && matchBrand && matchCat;
    });
  }, [recycleBin, recycleSearch, recycleBrandFilter, recycleCategoryFilter]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    [...products, ...recycleBin].forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products, recycleBin]);

  // =========================================================================
  // 3. ENQUIRIES & QUOTATION PRICING DESK HANDLERS
  // =========================================================================
  const openEnquiryPricingDesk = (enquiry: QuotationRecord) => {
    setSelectedEnquiry(enquiry);
    setQuoteSavedSuccess(false);

    const initItems = (enquiry.items || []).map((item: any) => {
      const catalogRef = products.find((p) => p.id === item.id || p.sku === item.sku);
      const defaultUnitPrice = item.unitPrice ?? catalogRef?.price ?? 15000;
      const defaultInstallation = item.installationCharge ?? item.laborCharge ?? 1500;

      return {
        ...item,
        unitPrice: defaultUnitPrice,
        installationCharge: defaultInstallation,
        laborCharge: defaultInstallation,
        quantity: item.quantity || 1,
      };
    });

    setPricingItems(initItems);
    setQuoteDiscount(enquiry.discountAmount || 0);
    setCustomInstallationCharge(enquiry.installationTotal !== undefined ? Number(enquiry.installationTotal) : null);
    setIsGstEnabled(enquiry.isGstEnabled !== undefined ? Boolean(enquiry.isGstEnabled) : true);
    setCustomGstRate(enquiry.customGstRate !== undefined ? Number(enquiry.customGstRate) : 18);

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        const desk = document.getElementById("quotation-pricing-desk");
        desk?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const quoteSubtotal = useMemo(() => {
    return pricingItems.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1), 0);
  }, [pricingItems]);

  const itemsInstallationSum = useMemo(() => {
    return pricingItems.reduce((sum, item) => sum + (Number(item.installationCharge ?? item.laborCharge) || 0), 0);
  }, [pricingItems]);

  const quoteInstallationTotal = customInstallationCharge !== null ? customInstallationCharge : itemsInstallationSum;
  const quoteLaborTotal = quoteInstallationTotal;

  const quoteTaxable = Math.max(0, quoteSubtotal + quoteInstallationTotal - (Number(quoteDiscount) || 0));
  const quoteGst = isGstEnabled ? Math.round(quoteTaxable * (Math.max(0, Number(customGstRate) || 0) / 100)) : 0;
  const quoteGrandTotal = quoteTaxable + quoteGst;

  const handleSaveAndFinalizeQuotation = async () => {
    if (!selectedEnquiry) return;
    setSavingQuote(true);

    try {
      const payload = {
        items: pricingItems.map((item) => ({
          ...item,
          laborCharge: Number(item.installationCharge ?? item.laborCharge) || 0,
          installationCharge: Number(item.installationCharge ?? item.laborCharge) || 0,
          total: (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1) + (Number(item.installationCharge ?? item.laborCharge) || 0),
        })),
        subtotal: quoteSubtotal,
        laborTotal: quoteInstallationTotal,
        installationTotal: quoteInstallationTotal,
        discountAmount: Number(quoteDiscount) || 0,
        isGstEnabled,
        customGstRate: Number(customGstRate) || 0,
        taxAmount: quoteGst,
        grandTotal: quoteGrandTotal,
        isPriced: true,
        status: "Priced & Dispatched",
      };

      const res = await fetch(`/api/quotations/${selectedEnquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save quotation");

      const updated = await res.json();
      setEnquiries((prev) =>
        prev.map((q) => (q.id === selectedEnquiry.id ? { ...q, ...updated } : q))
      );
      setSelectedEnquiry(updated);
      setQuoteSavedSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Error finalizing quotation.");
    } finally {
      setSavingQuote(false);
    }
  };

  const handleShareQuoteWhatsApp = () => {
    if (!selectedEnquiry) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const quoteUrl = `${origin}/quotation?id=${selectedEnquiry.id}`;

    const itemsSummary = pricingItems
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.name}* (Qty: ${it.quantity}) - ₹${((Number(it.unitPrice) || 0) * (it.quantity || 1)).toLocaleString("en-IN")} + Installation: ₹${Number(it.installationCharge ?? it.laborCharge ?? 0).toLocaleString("en-IN")}`
      )
      .join("\n");

    const gstLine = isGstEnabled
      ? `GST (${customGstRate}%): ₹${quoteGst.toLocaleString("en-IN")}`
      : `GST: Exempted / 0%`;

    const message = `*CARS9 BESPOKE AUTOMOTIVE STUDIO - ESTIMATE*
---------------------------------------
*Ref ID:* ${selectedEnquiry.id}
*Customer:* ${selectedEnquiry.customerName}
*Vehicle:* ${selectedEnquiry.vehicleBrand} ${selectedEnquiry.vehicleModel} ${selectedEnquiry.vehicleYear || ""}

*Approved Components & Installation:*
${itemsSummary}

*FINANCIAL SUMMARY:*
Subtotal: ₹${quoteSubtotal.toLocaleString("en-IN")}
Installation Charges: ₹${quoteInstallationTotal.toLocaleString("en-IN")}
Discount: -₹${Number(quoteDiscount).toLocaleString("en-IN")}
${gstLine}
*GRAND TOTAL: ₹${quoteGrandTotal.toLocaleString("en-IN")}*

*View Official Studio Quotation & Book Bay:*
${quoteUrl}
---------------------------------------
Thank you for choosing Cars9 Studio!`;

    const dispatchPhone = (settings.whatsapp_dispatch_phone || selectedEnquiry.customerPhone || settings.whatsapp_master_phone || "").replace(/\D/g, "");
    if (dispatchPhone) {
      window.open(`https://wa.me/${dispatchPhone}?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  const handleCopyQuoteLink = () => {
    if (!selectedEnquiry || typeof window === "undefined") return;
    const quoteUrl = `${window.location.origin}/quotation?id=${selectedEnquiry.id}`;
    navigator.clipboard.writeText(quoteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenPrintQuote = async () => {
    if (!selectedEnquiry) return;
    setSavingQuote(true);
    try {
      const payload = {
        items: pricingItems.map((item) => ({
          ...item,
          laborCharge: Number(item.installationCharge ?? item.laborCharge) || 0,
          installationCharge: Number(item.installationCharge ?? item.laborCharge) || 0,
          total: (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1) + (Number(item.installationCharge ?? item.laborCharge) || 0),
        })),
        subtotal: quoteSubtotal,
        laborTotal: quoteInstallationTotal,
        installationTotal: quoteInstallationTotal,
        discountAmount: Number(quoteDiscount) || 0,
        isGstEnabled,
        customGstRate: Number(customGstRate) || 0,
        taxAmount: quoteGst,
        grandTotal: quoteGrandTotal,
        isPriced: true,
        status: "Priced & Dispatched",
      };

      const res = await fetch(`/api/quotations/${selectedEnquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setEnquiries((prev) =>
          prev.map((q) => (q.id === selectedEnquiry.id ? { ...q, ...updated } : q))
        );
        setSelectedEnquiry(updated);
        setQuoteSavedSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingQuote(false);
    }

    // Opens the customer preview link bill in dedicated print mode
    window.open(`/quotation?id=${selectedEnquiry.id}&print=1`, "_blank");
  };

  const handlePrintQuotation = () => {
    if (!selectedEnquiry) return;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const configuredLogo = settings?.site_logo_url?.trim();
    const logoUrl = configuredLogo
      ? (configuredLogo.startsWith("http") ? configuredLogo : `${origin}${configuredLogo.startsWith("/") ? "" : "/"}${configuredLogo}`)
      : `${origin}/images/cars9-logo.png`;

    const quotePhone = settings.whatsapp_dispatch_phone || settings.whatsapp_master_phone || settings.footer_phone || "+91 90000 00000";
    const quoteEmail = settings.footer_email || "support@cars9.com";
    const quoteDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const itemsRows = pricingItems.map((item, idx) => {
      const unitP = Number(item.unitPrice) || 0;
      const qty = Number(item.quantity) || 1;
      const installP = Number(item.installationCharge ?? item.laborCharge) || 0;
      const lineTotal = (unitP * qty) + installP;

      return `
        <tr>
          <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; color: #64748b; font-size: 11px;">${idx + 1}</td>
          <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; color: #0f172a; font-size: 12px;">${item.name || "Accessory Component"}</div>
            ${item.sku ? `<div style="font-family: monospace; font-size: 10px; color: #64748b; margin-top: 2px;">SKU: ${item.sku}</div>` : ""}
          </td>
          <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-weight: 700; font-size: 12px;">${qty}</td>
          <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-size: 12px;">₹${unitP.toLocaleString("en-IN")}</td>
          <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-size: 12px;">₹${installP.toLocaleString("en-IN")}</td>
          <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; font-size: 12px;">₹${lineTotal.toLocaleString("en-IN")}</td>
        </tr>
      `;
    }).join("");

    const discountRow = Number(quoteDiscount) > 0 ? `
      <div style="display: flex; justify-content: space-between; color: #059669; font-weight: 700; margin-bottom: 6px;">
        <span>Studio Discount:</span>
        <span>-₹${Number(quoteDiscount).toLocaleString("en-IN")}</span>
      </div>
    ` : "";

    const gstRow = isGstEnabled ? `
      <div style="display: flex; justify-content: space-between; color: #475569; margin-bottom: 6px;">
        <span>GST (${customGstRate}%):</span>
        <span style="font-weight: 700; color: #0f172a;">₹${quoteGst.toLocaleString("en-IN")}</span>
      </div>
    ` : `
      <div style="display: flex; justify-content: space-between; color: #475569; margin-bottom: 6px;">
        <span>GST:</span>
        <span style="font-weight: 700; color: #d97706;">Exempted / 0%</span>
      </div>
    `;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Cars9 Quotation - ${selectedEnquiry.id}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.45;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-family: monospace;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 12px;
      border-bottom: 2px solid #cbd5e1;
    }
  </style>
</head>
<body>
  <div style="max-width: 780px; margin: 0 auto; background: #ffffff;">
    <!-- Studio Header with Official Logo -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 18px;">
      <div>
        <img src="${logoUrl}" alt="Cars9 Logo" style="height: 48px; max-width: 220px; object-fit: contain; display: block; margin-bottom: 6px;" onerror="this.onerror=null; this.src='${origin}/images/cars9-logo.png';" />
        <div style="font-size: 13px; font-weight: 800; color: #dc2626; letter-spacing: -0.3px;">CARS9 BESPOKE AUTOMOTIVE STUDIO</div>
        <div style="font-size: 11px; color: #475569;">Premium OEM-Grade Accessories & Acoustic Architecture</div>
        <div style="font-size: 10px; font-family: monospace; color: #64748b; margin-top: 3px;">
          Phone: ${quotePhone} • Email: ${quoteEmail}
        </div>
      </div>

      <div style="text-align: right; font-family: monospace;">
        <div style="font-size: 15px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">OFFICIAL ESTIMATE</div>
        <div style="font-size: 12px; color: #334155; margin-top: 3px;">
          Ref ID: <strong style="color: #dc2626;">${selectedEnquiry.id}</strong>
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
          Date: <strong>${quoteDate}</strong>
        </div>
        <div style="display: inline-block; margin-top: 5px; padding: 2px 8px; border-radius: 4px; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; font-size: 10px; font-weight: 700;">
          PRICED ESTIMATE
        </div>
      </div>
    </div>

    <!-- Customer & Vehicle Info -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 18px;">
      <div>
        <div style="font-size: 10px; font-family: monospace; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px;">Customer Information</div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${selectedEnquiry.customerName || "Customer"}</div>
        <div style="font-size: 11px; font-family: monospace; color: #475569; margin-top: 2px;">Phone: ${selectedEnquiry.customerPhone || "N/A"}</div>
        ${selectedEnquiry.customerEmail ? `<div style="font-size: 11px; font-family: monospace; color: #475569;">Email: ${selectedEnquiry.customerEmail}</div>` : ""}
      </div>

      <div>
        <div style="font-size: 10px; font-family: monospace; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px;">Vehicle Fitment Details</div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${selectedEnquiry.vehicleBrand || ""} ${selectedEnquiry.vehicleModel || ""}</div>
        <div style="font-size: 11px; font-family: monospace; color: #475569; margin-top: 2px;">Model Year: ${selectedEnquiry.vehicleYear || "All Compatible Years"}</div>
        <div style="font-size: 10px; font-family: monospace; color: #059669; font-weight: 600; margin-top: 2px;">✓ Coupler-to-Coupler OEM Wiring Guaranteed</div>
      </div>
    </div>

    <!-- Table of Accessories -->
    <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 18px;">
      <table>
        <thead>
          <tr>
            <th style="text-align: left; width: 35px;">#</th>
            <th style="text-align: left;">Component / Accessory</th>
            <th style="text-align: center; width: 50px;">Qty</th>
            <th style="text-align: right; width: 95px;">Unit Price</th>
            <th style="text-align: right; width: 100px;">Installation</th>
            <th style="text-align: right; width: 105px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Financial Breakdown -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
      <div style="width: 320px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-family: monospace; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; color: #475569; margin-bottom: 5px;">
          <span>Components Subtotal:</span>
          <span style="font-weight: 700; color: #0f172a;">₹${quoteSubtotal.toLocaleString("en-IN")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #475569; margin-bottom: 5px;">
          <span>Installation Charges:</span>
          <span style="font-weight: 700; color: #0f172a;">₹${quoteInstallationTotal.toLocaleString("en-IN")}</span>
        </div>
        ${discountRow}
        ${gstRow}
        <div style="display: flex; justify-content: space-between; border-top: 2px solid #cbd5e1; padding-top: 7px; margin-top: 7px; font-size: 14px; font-weight: 900; color: #0f172a;">
          <span>GRAND TOTAL:</span>
          <span style="color: #dc2626;">₹${quoteGrandTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>

    <!-- Studio Terms & Warranty Assurance -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 3px;">Studio Guarantee & Installation Terms:</div>
      <ul style="font-size: 10px; color: #64748b; padding-left: 16px; line-height: 1.55;">
        <li>OEM wiring integrity preserved with dedicated coupler-to-coupler harness connectors (Zero Wire Cut Warranty).</li>
        <li>Official digital studio warranty certificate registered upon vehicle bay delivery.</li>
        <li>Estimate valid for 15 days from issuance date. Bay slots subject to advance reservation.</li>
      </ul>
    </div>

    <!-- Signature Blocks -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px solid #e2e8f0;">
      <div style="width: 180px;">
        <div style="border-bottom: 1px solid #cbd5e1; height: 32px; margin-bottom: 5px;"></div>
        <div style="font-size: 10px; font-family: monospace; color: #64748b;">Customer Acceptance Signature</div>
      </div>

      <div style="width: 200px; text-align: right;">
        <div style="border-bottom: 1px solid #cbd5e1; height: 32px; margin-bottom: 5px;"></div>
        <div style="font-size: 10px; font-family: monospace; color: #64748b;">Authorized Signatory • Cars9 Studio</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    let iframe = document.getElementById("quote-print-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "quote-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);
    }

    const frameDoc = iframe.contentWindow?.document;
    if (!frameDoc) return;

    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    // Trigger print preview without blank pages
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  };

  // =========================================================================
  // 4. WARRANTY HANDLERS (Admin View & Register)
  // =========================================================================
  const handleRegisterNewWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteringWarranty(true);

    try {
      const res = await fetch("/api/warranties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWarrantyForm),
      });

      if (!res.ok) throw new Error("Failed to register warranty");
      const created = await res.json();
      setWarranties((prev) => [created, ...prev]);
      setShowRegisterWarrantyModal(false);
      alert(`Warranty Certificate #${created.id} successfully registered!`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setRegisteringWarranty(false);
    }
  };

  const filteredWarranties = useMemo(() => {
    return warranties.filter((w) => {
      const q = warrantySearch.toLowerCase().trim();
      return (
        !q ||
        w.customerName.toLowerCase().includes(q) ||
        w.customerPhone.includes(q) ||
        w.vehicleRegNo.toLowerCase().includes(q) ||
        w.serialNumber.toLowerCase().includes(q) ||
        w.invoiceNo.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q)
      );
    });
  }, [warranties, warrantySearch]);

  // =========================================================================
  // 5. SECURITY & PASSWORDS CONTROL (Admin Configurable)
  // =========================================================================
  const handleSavePasswords = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSavedMsg("");

    const updates: Record<string, string> = {};
    if (newAdminPassword.trim()) updates.admin_password = newAdminPassword.trim();
    if (newStaffPassword.trim()) updates.staff_password = newStaffPassword.trim();

    if (Object.keys(updates).length === 0) return;

    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setPasswordSavedMsg("Passwords updated successfully! Active immediately.");
      setNewAdminPassword("");
      setNewStaffPassword("");
    } catch (err) {
      alert("Failed to update passwords");
    }
  };

  // =========================================================================
  // 5B. BRANDING & FOOTER CONTROLS
  // =========================================================================
  useEffect(() => {
    if (settings) {
      setFooterForm({
        description: settings.footer_description || "India's premier custom automotive accessory studio. OEM coupler-to-coupler fitment, precision sound engineering, QLED digital touchscreens, and European laser optics.",
        guaranteeText: settings.footer_guarantee_text || "100% Zero Wire Slicing Guarantee",
        phone: settings.footer_phone || "+91 90000 00000 / +91 98888 88888",
        email: settings.footer_email || "concierge@cars9studio.com",
        address: settings.footer_address || "Main Studio Bay, HSR Layout / Indiranagar, Bangalore",
        mapsUrl: settings.footer_maps_url || "https://maps.google.com/?q=Cars9+Automotive+Studio+Bangalore",
        timings: settings.footer_timings || "Monday – Saturday: 10:00 AM – 8:30 PM\nSunday: By Prior Appointment Only\nDust-Free Closed Installation Bays\nPrecision Acoustic Calibration Bay",
        copyright: settings.footer_copyright || "© {year} CARS9 Automotive Studio. All rights reserved.",
        showWarranty: settings.footer_show_warranty_link !== false,
        showPricing: settings.footer_show_pricing_link !== false,
        showAdmin: settings.footer_show_admin_link !== false,
        socialInstagram: settings.footer_social_instagram || "",
        socialFacebook: settings.footer_social_facebook || "",
        socialYoutube: settings.footer_social_youtube || "",
        socialWhatsapp: settings.footer_social_whatsapp || "",
        socialTwitter: settings.footer_social_twitter || "",
      });
      setCustomLogoUrlInput(settings.site_logo_url || "");
      setWhatsappMasterInput(settings.whatsapp_master_phone || "+91 90000 00000");
      setWhatsappCardInput(settings.whatsapp_card_phone || "");
      setWhatsappFooterInput(settings.whatsapp_footer_phone || "");
      setWhatsappPdpInput(settings.whatsapp_pdp_phone || "");
      setWhatsappQuotationInput(settings.whatsapp_quotation_phone || "");
      setWhatsappDispatchInput(settings.whatsapp_dispatch_phone || "");
      setDefaultBannerForm({
        title1: settings.default_banner_title1 || "ELEVATE YOUR CAR WITH",
        title2: settings.default_banner_title2 || "CUSTOM ACCESSORIES",
        subtitle: settings.default_banner_subtitle || "Discover custom 7D floor mats, Nappa leatherette seat covers, app-controlled ambient lighting, 4K dual-lens dash cams, and off-road enhancements engineered to fit your exact vehicle model.",
        ctaText: settings.default_banner_cta || "EXPLORE BRANDS",
        imageUrl: settings.default_banner_image || "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1920&auto=format&fit=crop",
        imageUrlLight: settings.default_banner_image_light || "",
      });
      setHomeCard1Title(settings.home_card1_title || "Zero Wire Slicing");
      setHomeCard1Sub(settings.home_card1_subtitle || "100% OEM Couplers");
      setHomeCard1Url(settings.home_card1_url || "");

      setHomeCard2Title(settings.home_card2_title || "Warranty Protected");
      setHomeCard2Sub(settings.home_card2_subtitle || "Verify Certificate →");
      setHomeCard2Url(settings.home_card2_url !== undefined ? settings.home_card2_url : "/warranty");

      setHomeCard3Title(settings.home_card3_title || "WhatsApp Chat");
      setHomeCard3Sub(settings.home_card3_subtitle || "Direct Chat →");
      setHomeCard3Url(settings.home_card3_url || "");

      setHomeCard4Title(settings.home_card4_title || "Store Locator");
      setHomeCard4Sub(settings.home_card4_subtitle || "Google Maps →");
      setHomeCard4Url(settings.home_card4_url || "");
    }
  }, [settings]);

  const handleSaveDefaultBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalTitle1 = defaultBannerForm.title1.trim() || DEFAULT_BANNER_CONFIG.title1;
      const finalTitle2 = defaultBannerForm.title2.trim() || DEFAULT_BANNER_CONFIG.title2;
      const finalSubtitle = defaultBannerForm.subtitle.trim() || DEFAULT_BANNER_CONFIG.subtitle;
      const finalCta = defaultBannerForm.ctaText.trim() || DEFAULT_BANNER_CONFIG.ctaText;
      const finalImage = defaultBannerForm.imageUrl.trim() || DEFAULT_BANNER_CONFIG.imageUrl;
      const finalImageLight = defaultBannerForm.imageUrlLight.trim();

      await updateSetting("default_banner_title1", finalTitle1);
      await updateSetting("default_banner_title2", finalTitle2);
      await updateSetting("default_banner_subtitle", finalSubtitle);
      await updateSetting("default_banner_cta", finalCta);
      await updateSetting("default_banner_image", finalImage);
      await updateSetting("default_banner_image_light", finalImageLight);

      setDefaultBannerForm({
        title1: finalTitle1,
        title2: finalTitle2,
        subtitle: finalSubtitle,
        ctaText: finalCta,
        imageUrl: finalImage,
        imageUrlLight: finalImageLight,
      });

      setDefaultBannerSavedMsg("Default fallback banner saved successfully!");
      showToastNotice("Default fallback banner saved successfully!", "success");
      setTimeout(() => setDefaultBannerSavedMsg(""), 4000);
    } catch (err: any) {
      alert("Failed to save default banner: " + err.message);
    }
  };

  const handleDefaultBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDefaultBannerImage(true);
    try {
      const url = await uploadFileToTelegram(file);
      if (url) {
        setDefaultBannerForm((prev) => ({ ...prev, imageUrl: url }));
        showToastNotice("Default banner background uploaded! Click Save to apply.", "info");
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingDefaultBannerImage(false);
      e.target.value = "";
    }
  };

  const handleDefaultBannerLightImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDefaultBannerLightImage(true);
    try {
      const url = await uploadFileToTelegram(file);
      if (url) {
        setDefaultBannerForm((prev) => ({ ...prev, imageUrlLight: url }));
        showToastNotice("Light mode banner background uploaded! Click Save to apply.", "info");
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingDefaultBannerLightImage(false);
      e.target.value = "";
    }
  };

  const handleSiteLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSiteLogo(true);
    try {
      const url = await uploadFileToTelegram(file);
      if (url) {
        await updateSetting("site_logo_url", url);
        setCustomLogoUrlInput(url);
        showToastNotice("Site logo successfully uploaded and updated across Header & Footer!", "success");
      }
    } catch (err: any) {
      alert("Failed to upload site logo: " + err.message);
    } finally {
      setUploadingSiteLogo(false);
      e.target.value = "";
    }
  };

  const handleSetCustomLogoUrl = async () => {
    if (!customLogoUrlInput.trim()) {
      alert("Please enter a valid image URL or use 'Reset to Default Logo'.");
      return;
    }
    await updateSetting("site_logo_url", customLogoUrlInput.trim());
    showToastNotice("Site logo URL updated across Header & Footer!", "success");
  };

  const handleResetSiteLogo = async () => {
    await updateSetting("site_logo_url", "/images/cars9-logo.png");
    setCustomLogoUrlInput("/images/cars9-logo.png");
    showToastNotice("Site logo reset to default Cars9 Studio official logo.", "info");
  };

  const handleSaveFooterInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSetting("footer_description", footerForm.description);
      await updateSetting("footer_guarantee_text", footerForm.guaranteeText);
      await updateSetting("footer_phone", footerForm.phone);
      await updateSetting("footer_email", footerForm.email);
      await updateSetting("footer_address", footerForm.address);
      await updateSetting("footer_maps_url", footerForm.mapsUrl);
      await updateSetting("footer_timings", footerForm.timings);
      await updateSetting("footer_copyright", footerForm.copyright);
      await updateSetting("footer_show_warranty_link", footerForm.showWarranty);
      await updateSetting("footer_show_pricing_link", footerForm.showPricing);
      await updateSetting("footer_show_admin_link", footerForm.showAdmin);
      await updateSetting("footer_social_instagram", footerForm.socialInstagram);
      await updateSetting("footer_social_facebook", footerForm.socialFacebook);
      await updateSetting("footer_social_youtube", footerForm.socialYoutube);
      await updateSetting("footer_social_whatsapp", footerForm.socialWhatsapp);
      await updateSetting("footer_social_twitter", footerForm.socialTwitter);
      
      setFooterSavedMsg("Footer settings and studio details updated successfully!");
      showToastNotice("Footer settings saved successfully!", "success");
      setTimeout(() => setFooterSavedMsg(""), 4000);
    } catch (err: any) {
      alert("Failed to save footer settings: " + err.message);
    }
  };

  const handleApplyMasterToAll = () => {
    const val = whatsappMasterInput.trim();
    if (!val) {
      showToastNotice("Please enter a Master WhatsApp number first", "error");
      return;
    }
    setWhatsappCardInput(val);
    setWhatsappFooterInput(val);
    setWhatsappPdpInput(val);
    setWhatsappQuotationInput(val);
    setWhatsappDispatchInput(val);
    setWhatsappAppliedMsg("✓ Master number applied to all 5 touchpoints! Click Save to apply.");
    setTimeout(() => setWhatsappAppliedMsg(""), 4000);
  };

  const handleSaveWhatsAppNumbers = async () => {
    setSavingWhatsApp(true);
    try {
      await updateSetting("whatsapp_master_phone", whatsappMasterInput.trim());
      await updateSetting("whatsapp_card_phone", whatsappCardInput.trim());
      await updateSetting("whatsapp_footer_phone", whatsappFooterInput.trim());
      await updateSetting("whatsapp_pdp_phone", whatsappPdpInput.trim());
      await updateSetting("whatsapp_quotation_phone", whatsappQuotationInput.trim());
      await updateSetting("whatsapp_dispatch_phone", whatsappDispatchInput.trim());

      // If footer WhatsApp number or master number was provided, also sync footer_social_whatsapp
      const effectiveFooter = whatsappFooterInput.trim() || whatsappMasterInput.trim();
      if (effectiveFooter) {
        const formattedFooter = effectiveFooter.startsWith("http")
          ? effectiveFooter
          : `https://wa.me/${effectiveFooter.replace(/\D/g, "")}`;
        await updateSetting("footer_social_whatsapp", formattedFooter);
        setFooterForm((prev) => ({ ...prev, socialWhatsapp: formattedFooter }));
      }

      setWhatsappSavedMsg("WhatsApp routing numbers saved successfully!");
      showToastNotice("WhatsApp configuration updated successfully!", "success");
      setTimeout(() => setWhatsappSavedMsg(""), 4000);
    } catch (err: any) {
      alert("Failed to save WhatsApp settings: " + err.message);
    } finally {
      setSavingWhatsApp(false);
    }
  };

  const handleSaveHomeCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHomeCards(true);
    try {
      await Promise.all([
        updateSetting("home_card1_title", homeCard1Title.trim()),
        updateSetting("home_card1_subtitle", homeCard1Sub.trim()),
        updateSetting("home_card1_url", homeCard1Url.trim()),

        updateSetting("home_card2_title", homeCard2Title.trim()),
        updateSetting("home_card2_subtitle", homeCard2Sub.trim()),
        updateSetting("home_card2_url", homeCard2Url.trim()),

        updateSetting("home_card3_title", homeCard3Title.trim()),
        updateSetting("home_card3_subtitle", homeCard3Sub.trim()),
        updateSetting("home_card3_url", homeCard3Url.trim()),

        updateSetting("home_card4_title", homeCard4Title.trim()),
        updateSetting("home_card4_subtitle", homeCard4Sub.trim()),
        updateSetting("home_card4_url", homeCard4Url.trim()),
      ]);
      setHomeCardsSavedMsg("Homepage feature cards updated successfully!");
      showToastNotice("Homepage action cards saved successfully!", "success");
      setTimeout(() => setHomeCardsSavedMsg(""), 4000);
    } catch (err: any) {
      alert("Failed to save homepage cards: " + err.message);
    } finally {
      setSavingHomeCards(false);
    }
  };

  const fetchTelegramStatus = async () => {
    try {
      const res = await fetch("/api/telegram/status");
      if (res.ok) {
        const data = await res.json();
        setTgStatus(data);
      }
    } catch (e) {
      console.error("Error loading Telegram status", e);
    }
  };

  const handleSaveTelegramConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgBotToken && !tgChatId) {
      setTgMsg("Please enter Bot Token and/or Chat ID");
      return;
    }
    setTestingTg(true);
    setTgMsg("");
    try {
      const res = await fetch("/api/telegram/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: tgBotToken, chatId: tgChatId }),
      });
      const data = await res.json();
      if (data.success) {
        setTgMsg("Telegram configuration saved & verified successfully!");
        fetchTelegramStatus();
      } else {
        setTgMsg(`Connection failed: ${data.error || "Check your credentials"}`);
      }
    } catch (err: any) {
      setTgMsg(`Error: ${err.message}`);
    } finally {
      setTestingTg(false);
    }
  };

  const handleUploadSlot = async (slotIndex: number, file: File) => {
    setUploadingSlot(slotIndex);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const newImgs = [...productForm.images];
        newImgs[slotIndex] = data.url;
        setProductForm({ ...productForm, images: newImgs });
      } else {
        alert("Upload error: " + (data.error || "Failed to upload image"));
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleUploadBannerImage = async (file: File) => {
    if (!editingBanner) return;
    setUploadingBanner(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditingBanner({ ...editingBanner, imageUrl: data.url });
      } else {
        alert("Upload error: " + (data.error || "Failed to upload banner"));
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingBanner(false);
    }
  };

  // Image Upload handler
  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", uploadFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadedUrl(data.url);
      } else {
        alert("Upload error: " + (data.error || "Unknown"));
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Active vs Deleted Brands & Models computations
  const activeBrands = useMemo(() => {
    const list = brands.filter((b) => !b.isDeleted);
    return [...list].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  }, [brands]);

  const deletedBrands = useMemo(() => {
    return brands.filter((b) => b.isDeleted);
  }, [brands]);

  const deletedModelsList = useMemo(() => {
    const list: Array<{
      brandId: string;
      brandName: string;
      modelName: string;
      imageUrl?: string;
      years?: string[];
      deletedAt?: string;
    }> = [];
    brands.forEach((b) => {
      if (!b.isDeleted && Array.isArray(b.subbrands)) {
        b.subbrands.forEach((s: any) => {
          if (s.isDeleted) {
            list.push({
              brandId: b.id,
              brandName: b.name,
              modelName: s.name,
              imageUrl: s.imageUrl,
              years: s.years,
              deletedAt: s.deletedAt,
            });
          }
        });
      }
    });
    return list;
  }, [brands]);

  const totalVehicleRecycleCount = deletedBrands.length + deletedModelsList.length;

  const filteredActiveBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return activeBrands;
    return activeBrands.filter((b) => {
      const matchBrand = b.name.toLowerCase().includes(q);
      const matchModels = (b.subbrands || []).some(
        (s: any) =>
          !s.isDeleted &&
          (s.name.toLowerCase().includes(q) ||
            (Array.isArray(s.years) && s.years.some((y: string) => y.toLowerCase().includes(q))))
      );
      return matchBrand || matchModels;
    });
  }, [activeBrands, brandSearch]);

  const activeModelsCount = useMemo(() => {
    return activeBrands.reduce((acc, b) => acc + (b.subbrands || []).filter((s: any) => !s.isDeleted).length, 0);
  }, [activeBrands]);

  // Theme-aware style helpers
  const isDark = adminTheme === "dark";
  const bgClass = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900";
  const cardClass = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const innerCardClass = isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200";
  const inputClass = isDark
    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-red-500"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-red-500";

  // =========================================================================
  // LOGIN SCREEN (With Full Admin Sign In vs Staff Easy Entry Password Only)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${bgClass} flex flex-col justify-center items-center p-4 relative transition-colors duration-200`}>
        
        {/* Dark / Light Toggle on the Login Screen itself */}
        <div className="absolute top-6 right-6">
          <button
            onClick={toggleAdminTheme}
            className={`p-2.5 rounded-2xl border transition flex items-center gap-2 text-xs font-mono font-bold ${
              isDark
                ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
            }`}
            title="Toggle Dark / Light Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
            <span className="hidden sm:inline">{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        <div className={`w-full max-w-md ${cardClass} border rounded-3xl p-8 shadow-2xl space-y-6`}>
          <div className="text-center space-y-2">
            <Cars9Logo size="sm" href="/" className="justify-center" />
            <h1 className="text-xl font-bold tracking-tight">Studio Personnel Portal</h1>
            <p className="text-xs opacity-60">
              Select access tier to manage enquiries, quotations & warranties.
            </p>
          </div>

          {/* Login Mode Switcher: Staff Access First, then Master Admin */}
          <div className={`grid grid-cols-2 p-1 rounded-2xl border text-xs font-bold ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
          }`}>
            <button
              type="button"
              onClick={() => {
                setLoginMode("staff");
                setAuthError("");
              }}
              className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                loginMode === "staff"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Staff Access</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode("admin");
                setAuthError("");
              }}
              className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                loginMode === "admin"
                  ? "bg-red-600 text-white shadow-md"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Master Admin</span>
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
              {authError}
            </div>
          )}

          {/* Form 1: Staff Easy Entry (Default Primary View) */}
          {loginMode === "staff" && (
            <form onSubmit={handleStaffLogin} className="space-y-4 animate-in fade-in">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                ⚡ <strong>Studio Staff Access:</strong> Enter employee password to manage customer enquiries, custom quotations, and digital warranty certificates.
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  Staff Access Password *
                </label>
                <input
                  type="password"
                  value={staffPasswordInput}
                  onChange={(e) => setStaffPasswordInput(e.target.value)}
                  placeholder="Enter staff password..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${inputClass}`}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Enter Enquiries & Warranty Portal</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("admin");
                    setAuthError("");
                  }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition inline-flex items-center gap-1 font-mono"
                >
                  <Shield className="w-3 h-3" />
                  <span>Master Administrator? Sign In Here →</span>
                </button>
              </div>
            </form>
          )}

          {/* Form 2: Full Admin Login (Username + Password) */}
          {loginMode === "admin" && (
            <form onSubmit={handleAdminLogin} className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  Admin Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${inputClass}`}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  Admin Security Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${inputClass}`}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-red-600/30 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In as Master Admin</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("staff");
                    setAuthError("");
                  }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition inline-flex items-center gap-1 font-mono"
                >
                  <span>← Return to Staff Access</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN DASHBOARD (Full Admin View OR Staff Easy Access 2-Tab View)
  // =========================================================================
  return (
    <div className={`min-h-screen ${bgClass} flex flex-col font-sans transition-colors duration-200`}>
      
      {/* Top Header Bar: Responsive Two-Tier Architecture */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b shadow-sm ${
        isDark ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200"
      }`}>
        {/* TIER 1: Brand & Identity on Left | Quick Action Controls on Right */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Menu Button (< md) */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`md:hidden p-1.5 sm:p-2 rounded-xl border transition ${
                isDark 
                  ? "border-slate-800 bg-slate-800/80 text-white hover:bg-slate-700" 
                  : "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
              }`}
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <Cars9Logo size="sm" href="/" />
            
            {authRole === "staff" ? (
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Staff Access</span>
              </span>
            ) : (
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">Master Admin</span>
                <span className="sm:hidden">Admin</span>
              </span>
            )}
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Switch to Full Admin if currently in Staff Mode */}
            {authRole === "staff" && (
              <button
                onClick={switchToFullAdmin}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold transition"
                title="Switch to Master Admin Portal"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin Login</span>
              </button>
            )}

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleAdminTheme}
              className={`p-1.5 sm:p-2 rounded-xl border transition ${
                isDark ? "border-slate-800 hover:bg-slate-800 text-amber-400" : "border-slate-200 hover:bg-slate-100 text-slate-700"
              }`}
              title="Toggle Dark / Light Theme"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Refresh Data */}
            <button
              onClick={fetchAllData}
              className={`p-1.5 sm:p-2 rounded-xl border transition ${
                isDark ? "border-slate-800 hover:bg-slate-800 text-slate-400" : "border-slate-200 hover:bg-slate-100 text-slate-600"
              }`}
              title="Refresh All Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* View Storefront Link */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm ${
                isDark 
                  ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200" 
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
              }`}
              title="Open Storefront in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="hidden sm:inline">Storefront</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition opacity-80 hover:opacity-100 ${
                isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{authRole === "staff" ? "Exit" : "Logout"}</span>
            </button>
          </div>
        </div>

        {/* TIER 2: Dedicated Navigation Tabs */}
        <div className="px-3 sm:px-6 py-2">
          {/* For STAFF Role: Exactly 2 tabs rendered in a clean, spacious 2-column segmented control */}
          {authRole === "staff" ? (
            <div className={`grid grid-cols-2 max-w-md mx-auto p-1 rounded-2xl border text-xs font-bold ${
              isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                onClick={() => setActiveTab("enquiries")}
                className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 whitespace-nowrap relative ${
                  activeTab === "enquiries" ? "bg-emerald-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span>Enquiries</span>
                {enquiries.filter((q) => !q.isPriced).length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black animate-pulse">
                    {enquiries.filter((q) => !q.isPriced).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("warranties")}
                className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === "warranties" ? "bg-emerald-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Warranty Manager</span>
              </button>
            </div>
          ) : (
            /* For MASTER ADMIN Role: Mobile Sidebar Quick Trigger + Desktop 10-Tab Pill Bar */
            <div>
              {/* Mobile Quick Bar (< md): Shows Active Section & 1-Tap Menu Trigger */}
              <div className={`md:hidden flex items-center justify-between p-2 rounded-2xl border text-xs font-bold ${
                isDark ? "bg-slate-800/90 border-slate-700 text-white" : "bg-slate-100 border-slate-200 text-slate-900"
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-red-600/15 text-red-500 flex items-center justify-center shrink-0">
                    {activeTab === "enquiries" && <Inbox className="w-4 h-4" />}
                    {activeTab === "warranties" && <ShieldCheck className="w-4 h-4" />}
                    {activeTab === "inventory" && <Package className="w-4 h-4" />}
                    {activeTab === "brands" && <Car className="w-4 h-4" />}
                    {activeTab === "banners" && <Sliders className="w-4 h-4" />}
                    {activeTab === "plp_settings" && <LayoutGrid className="w-4 h-4" />}
                    {activeTab === "pdp_settings" && <FileCode className="w-4 h-4" />}
                    {activeTab === "branding_footer" && <ImageIcon className="w-4 h-4" />}
                    {activeTab === "security" && <KeyRound className="w-4 h-4" />}
                    {activeTab === "uploader" && <UploadCloud className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-mono block leading-tight uppercase">Active Section</span>
                    <span className="text-xs font-extrabold truncate block">
                      {activeTab === "enquiries" && "Enquiries & Quotations"}
                      {activeTab === "warranties" && "Warranty Management"}
                      {activeTab === "inventory" && "Catalog & Inventory"}
                      {activeTab === "brands" && "Brands & Models"}
                      {activeTab === "banners" && "Hero Banners"}
                      {activeTab === "plp_settings" && "PLP Controls"}
                      {activeTab === "pdp_settings" && "PDP Controls"}
                      {activeTab === "branding_footer" && "Branding & Footer"}
                      {activeTab === "security" && "Security & Passwords"}
                      {activeTab === "uploader" && "Telegram CDN"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md shrink-0 active:scale-95"
                >
                  <Menu className="w-3.5 h-3.5" />
                  <span>Tabs</span>
                </button>
              </div>

              {/* Desktop Tabs Bar (hidden md:flex): All 10 tabs in strict requested order */}
              <div className={`hidden md:flex items-center gap-1.5 p-1 rounded-2xl border text-xs overflow-x-auto scrollbar-none no-scrollbar ${
                isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-100 border-slate-200"
              }`}>
                {/* 1. Enquiries - FIRST PAGE */}
                <button
                  onClick={() => setActiveTab("enquiries")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap relative ${
                    activeTab === "enquiries" ? "bg-red-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Enquiries</span>
                  {enquiries.filter((q) => !q.isPriced).length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black animate-pulse">
                      {enquiries.filter((q) => !q.isPriced).length}
                    </span>
                  )}
                </button>

                {/* 2. Warranty Manager - SECOND PAGE */}
                <button
                  onClick={() => setActiveTab("warranties")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === "warranties" ? "bg-red-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Warranty Manager</span>
                </button>

                {/* 3. Catalog & Inventory */}
                <button
                  onClick={() => setActiveTab("inventory")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === "inventory" ? "bg-red-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Catalog & Inventory</span>
                </button>

                {/* 4. Brands & Models */}
                <button
                  onClick={() => {
                    setActiveTab("brands");
                    if (!selectedBrandForModels && brands.length > 0) {
                      setSelectedBrandForModels(brands[0]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === "brands" ? "bg-red-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Brands & Models</span>
                </button>

                {/* 5. Hero Banners */}
                <button
                  onClick={() => setActiveTab("banners")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === "banners" ? "bg-red-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Hero Banners</span>
                </button>

                {/* 6. PLP Controls */}
                <button
                  onClick={() => setActiveTab("plp_settings")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === "plp_settings" ? "bg-red-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>PLP Controls</span>
                </button>

                {/* 7. PDP Controls */}
                <button
                  onClick={() => setActiveTab("pdp_settings")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === "pdp_settings" ? "bg-red-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>PDP Controls</span>
                </button>

                {/* 8. Branding & Footer */}
                <button
                  onClick={() => setActiveTab("branding_footer")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === "branding_footer" ? "bg-red-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Branding & Footer</span>
                </button>

                {/* 9. Security & Passwords */}
                <button
                  onClick={() => setActiveTab("security")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === "security" ? "bg-red-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Passwords</span>
                </button>

                {/* 10. Telegram CDN */}
                <button
                  onClick={() => setActiveTab("uploader")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === "uploader" ? "bg-red-600 text-white shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Telegram CDN</span>
                  {tgStatus?.ok && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MOBILE LEFT SIDEBAR DRAWER (< md)                                     */}
      {/* ===================================================================== */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer content sliding from left */}
          <div className={`fixed inset-y-0 left-0 w-72 sm:w-80 max-w-[85vw] ${cardClass} border-r shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-left duration-200`}>
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cars9Logo size="sm" href="/" />
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  authRole === "staff" 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" 
                    : "bg-red-600/10 text-red-500 border border-red-500/30"
                }`}>
                  {authRole === "staff" ? "Staff Access" : "Master Admin"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                aria-label="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: All Tabs Navigation */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              
              {/* Operations Section */}
              <div>
                <span className="px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Studio Operations
                </span>
                <div className="space-y-1">
                  {/* 1. Enquiries - ALWAYS FIRST */}
                  <button
                    onClick={() => {
                      setActiveTab("enquiries");
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      activeTab === "enquiries"
                        ? "bg-red-600 text-white shadow-md"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Inbox className="w-4 h-4" />
                      <span>Enquiries & Quotations</span>
                    </div>
                    {enquiries.filter((q) => !q.isPriced).length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black animate-pulse">
                        {enquiries.filter((q) => !q.isPriced).length}
                      </span>
                    )}
                  </button>

                  {/* 2. Warranties - ALWAYS SECOND */}
                  <button
                    onClick={() => {
                      setActiveTab("warranties");
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      activeTab === "warranties"
                        ? "bg-red-600 text-white shadow-md"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Warranty Management</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Master Admin Sections */}
              {authRole === "admin" && (
                <>
                  {/* Catalog Management */}
                  <div>
                    <span className="px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Catalog Management
                    </span>
                    <div className="space-y-1">
                      {/* 3. Catalog & Inventory */}
                      <button
                        onClick={() => {
                          setActiveTab("inventory");
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          activeTab === "inventory"
                            ? "bg-red-600 text-white shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        <span>Catalog & Inventory</span>
                      </button>

                      {/* 4. Brands & Models */}
                      <button
                        onClick={() => {
                          setActiveTab("brands");
                          if (!selectedBrandForModels && brands.length > 0) {
                            setSelectedBrandForModels(brands[0]);
                          }
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          activeTab === "brands"
                            ? "bg-red-600 text-white shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <Car className="w-4 h-4" />
                        <span>Brands & Models</span>
                      </button>

                      {/* 5. Hero Banners */}
                      <button
                        onClick={() => {
                          setActiveTab("banners");
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          activeTab === "banners"
                            ? "bg-red-600 text-white shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <Sliders className="w-4 h-4" />
                        <span>Hero Banners</span>
                      </button>
                    </div>
                  </div>

                  {/* Storefront & Branding Controls */}
                  <div>
                    <span className="px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Storefront & Controls
                    </span>
                    <div className="space-y-1">
                      {/* 6. PLP Controls */}
                      <button
                        onClick={() => {
                          setActiveTab("plp_settings");
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          activeTab === "plp_settings"
                            ? "bg-red-600 text-white shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>PLP Controls</span>
                      </button>

                      {/* 7. PDP Controls */}
                      <button
                        onClick={() => {
                          setActiveTab("pdp_settings");
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          activeTab === "pdp_settings"
                            ? "bg-red-600 text-white shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <FileCode className="w-4 h-4" />
                        <span>PDP Controls</span>
                      </button>

                      {/* 8. Branding & Footer */}
                      <button
                        onClick={() => {
                          setActiveTab("branding_footer");
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          activeTab === "branding_footer"
                            ? "bg-red-600 text-white shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Branding & Footer</span>
                      </button>

                      {/* 9. Security */}
                      <button
                        onClick={() => {
                          setActiveTab("security");
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          activeTab === "security"
                            ? "bg-red-600 text-white shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Security & Passwords</span>
                      </button>

                      {/* 10. Telegram CDN */}
                      <button
                        onClick={() => {
                          setActiveTab("uploader");
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          activeTab === "uploader"
                            ? "bg-red-600 text-white shadow-md"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Telegram CDN</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-red-500" />
                <span>View Storefront</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-bold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{authRole === "staff" ? "Exit Staff Portal" : "Sign Out"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* ================================================================= */}
        {/* TAB 1: HERO BANNERS (Admin Only)                                  */}
        {/* ================================================================= */}
        {activeTab === "banners" && authRole === "admin" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Homepage Hero Banners (Auto-Carousel)</h2>
                <p className="text-xs opacity-60 mt-0.5">
                  Turn individual banners On/Off instantly. Active banners rotate automatically on the customer storefront.
                </p>
              </div>

              <button
                onClick={() =>
                  setEditingBanner({
                    id: 0,
                    title: "",
                    subtitle: "",
                    badge: "Special Feature",
                    imageUrl: "",
                    ctaText: "Explore Accessories",
                    ctaLink: "#catalog",
                    isActive: true,
                    sortOrder: banners.length + 1,
                  })
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Hero Banner</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className={`${cardClass} border rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                    banner.isActive ? "shadow-xl" : "opacity-50"
                  }`}
                >
                  <div className="relative aspect-16/9 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={getDisplayImageUrl(banner.imageUrl)}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                      Slide #{banner.sortOrder}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest block">
                        {banner.badge}
                      </span>
                      <h3 className="text-sm font-extrabold text-white truncate">{banner.title}</h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <p className="text-xs opacity-70 line-clamp-2 leading-relaxed">
                      {banner.subtitle}
                    </p>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleBanner(banner.id, banner.isActive)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition ${
                          banner.isActive
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {banner.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{banner.isActive ? "ACTIVE (ON)" : "DISABLED (OFF)"}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingBanner(banner)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit Banner Content"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this hero banner?")) return;
                            await fetch(`/api/banners/${banner.id}`, { method: "DELETE" });
                            setBanners((prev) => prev.filter((b) => b.id !== banner.id));
                          }}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-red-500/10 text-red-500 transition"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ================================================================= */}
            {/* Fallback Default Banner (Active when no custom banners are ON)    */}
            {/* ================================================================= */}
            <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 space-y-6 mt-8`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>Default Page Banner (Fallback)</span>
                  </h3>
                  <p className="text-xs opacity-60 mt-0.5">
                    Automatically displayed on the storefront when all individual hero banners are turned off or disabled.
                  </p>
                </div>
                {defaultBannerSavedMsg && (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-mono text-xs font-bold animate-in fade-in">
                    ✓ {defaultBannerSavedMsg}
                  </div>
                )}
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono opacity-70">
                    Live Preview (Customer Storefront View):
                  </span>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-[11px] font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => setDefaultBannerPreviewTheme("light")}
                      className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                        defaultBannerPreviewTheme === "light"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Light Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefaultBannerPreviewTheme("dark")}
                      className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                        defaultBannerPreviewTheme === "dark"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Moon className="w-3 h-3 text-indigo-400" />
                      <span>Dark Mode</span>
                    </button>
                  </div>
                </div>

                <div className={`relative w-full rounded-2xl overflow-hidden border aspect-21/9 min-h-[220px] flex items-center justify-center text-center p-6 shadow-xl transition-colors ${
                  defaultBannerPreviewTheme === "light"
                    ? "bg-slate-100 border-slate-200"
                    : "bg-slate-950 border-slate-700/60"
                }`}>
                  {(defaultBannerPreviewTheme === "light" && defaultBannerForm.imageUrlLight
                    ? defaultBannerForm.imageUrlLight
                    : defaultBannerForm.imageUrl) && (
                    <img
                      src={getDisplayImageUrl(
                        defaultBannerPreviewTheme === "light" && defaultBannerForm.imageUrlLight
                          ? defaultBannerForm.imageUrlLight
                          : defaultBannerForm.imageUrl
                      )}
                      alt="Banner Preview"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  )}

                  {defaultBannerPreviewTheme === "light" ? (
                    <>
                      <div className="absolute inset-0 bg-white/85 backdrop-blur-[0.5px]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/55 to-white/85" />
                      <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/80" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-[0.5px]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/85" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
                    </>
                  )}
                  
                  <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
                    <h2 className={`text-base sm:text-2xl font-black uppercase tracking-tight leading-tight ${
                      defaultBannerPreviewTheme === "light" ? "text-slate-900" : "text-white"
                    }`}>
                      <span>{defaultBannerForm.title1 || "ELEVATE YOUR CAR WITH"}</span>{" "}
                      <span className={`block mt-1 ${
                        defaultBannerPreviewTheme === "light" ? "text-red-600" : "text-amber-400"
                      }`}>
                        {defaultBannerForm.title2 || "CUSTOM ACCESSORIES"}
                      </span>
                    </h2>
                    <p className={`text-[11px] sm:text-xs mt-2 line-clamp-2 max-w-md ${
                      defaultBannerPreviewTheme === "light" ? "text-slate-600" : "text-slate-300"
                    }`}>
                      {defaultBannerForm.subtitle || "Discover custom 7D floor mats, Nappa leatherette seat covers..."}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">
                      <span>{defaultBannerForm.ctaText || "EXPLORE BRANDS"}</span>
                      <span>&rarr;</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveDefaultBanner} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                      Headline Title Line 1 (Primary Text)
                    </label>
                    <input
                      type="text"
                      value={defaultBannerForm.title1}
                      onChange={(e) => setDefaultBannerForm({ ...defaultBannerForm, title1: e.target.value })}
                      placeholder="e.g. ELEVATE YOUR CAR WITH"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${inputClass}`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                      Headline Highlight Line 2 (Accent Text)
                    </label>
                    <input
                      type="text"
                      value={defaultBannerForm.title2}
                      onChange={(e) => setDefaultBannerForm({ ...defaultBannerForm, title2: e.target.value })}
                      placeholder="e.g. CUSTOM ACCESSORIES"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono text-amber-500 font-bold ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                    Subtitle Description
                  </label>
                  <textarea
                    rows={2}
                    value={defaultBannerForm.subtitle}
                    onChange={(e) => setDefaultBannerForm({ ...defaultBannerForm, subtitle: e.target.value })}
                    placeholder="Enter subtitle description..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs leading-relaxed ${inputClass}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={defaultBannerForm.ctaText}
                    onChange={(e) => setDefaultBannerForm({ ...defaultBannerForm, ctaText: e.target.value })}
                    placeholder="e.g. EXPLORE BRANDS"
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono uppercase ${inputClass}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dark Mode Background Image */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider font-mono opacity-80 flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Background Image (Dark Mode / Default)</span>
                      </label>
                      <label className="cursor-pointer px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-bold flex items-center gap-1 transition">
                        <UploadCloud className="w-3 h-3" />
                        <span>{uploadingDefaultBannerImage ? "..." : "Upload"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDefaultBannerImageUpload}
                          disabled={uploadingDefaultBannerImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={defaultBannerForm.imageUrl}
                      onChange={(e) => setDefaultBannerForm({ ...defaultBannerForm, imageUrl: e.target.value })}
                      placeholder="https://... or /api/images/... dark mode image URL"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono normal-case ${inputClass}`}
                    />
                  </div>

                  {/* Light Mode Background Image */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider font-mono opacity-80 flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Background Image (Light Mode - Optional)</span>
                      </label>
                      <label className="cursor-pointer px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-bold flex items-center gap-1 transition">
                        <UploadCloud className="w-3 h-3" />
                        <span>{uploadingDefaultBannerLightImage ? "..." : "Upload"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDefaultBannerLightImageUpload}
                          disabled={uploadingDefaultBannerLightImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={defaultBannerForm.imageUrlLight}
                      onChange={(e) => setDefaultBannerForm({ ...defaultBannerForm, imageUrlLight: e.target.value })}
                      placeholder="Optional. If empty, uses main image with clean light overlay"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono normal-case ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Default Banner</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Banner Edit Modal */}
            {editingBanner && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
                <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto`}>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-base">
                      {editingBanner.id ? "Edit Hero Banner" : "New Hero Banner"}
                    </h3>
                    <button onClick={() => setEditingBanner(null)} className="opacity-60 hover:opacity-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div>
                      <label className="block mb-1 opacity-70">Headline Title *</label>
                      <input
                        type="text"
                        value={editingBanner.title}
                        onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                        className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 opacity-70">Subtitle Description</label>
                      <textarea
                        rows={2}
                        value={editingBanner.subtitle}
                        onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                        className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 opacity-70">Category Badge</label>
                        <input
                          type="text"
                          value={editingBanner.badge}
                          onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                          className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 opacity-70">Slide Order #</label>
                        <input
                          type="number"
                          value={editingBanner.sortOrder}
                          onChange={(e) => setEditingBanner({ ...editingBanner, sortOrder: Number(e.target.value) })}
                          className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="opacity-70 text-xs">Image URL (Telegram CDN or Link) *</label>
                        <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition">
                          <Camera className="w-3 h-3" />
                          <span>{uploadingBanner ? "Uploading to CDN..." : "Upload to Telegram CDN"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingBanner}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadBannerImage(f);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="https://... or /api/images/[file_id]"
                        value={editingBanner.imageUrl}
                        onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                        className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                      />
                      {editingBanner.imageUrl && (
                        <div className="mt-2 aspect-16/9 w-full max-h-32 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-black">
                          <img
                            src={getDisplayImageUrl(editingBanner.imageUrl)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingBanner(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveBanner(editingBanner)}
                      className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                    >
                      Save Banner
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: INVENTORY & CATALOG (Admin Only)                           */}
        {/* ================================================================= */}
        {activeTab === "inventory" && authRole === "admin" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Catalog & Inventory Management</h2>
                <p className="text-xs opacity-60 mt-0.5">
                  Dynamic Brand & Model hierarchy with multi-year compatibility, 5-6 photos, video URL, and CAD specs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openAddProductModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Accessory</span>
                </button>
              </div>
            </div>

            {/* Sub-tab navigation: Active Catalog vs Recycle Bin */}
            <div className={`flex items-center gap-1.5 p-1 rounded-2xl border w-fit ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-slate-200/90 border-slate-300"
            }`}>
              <button
                onClick={() => setCatalogSubTab("active")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  catalogSubTab === "active"
                    ? isDark
                      ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                      : "bg-white text-slate-950 shadow-sm border border-slate-300"
                    : isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-700 hover:text-slate-950"
                }`}
              >
                <Package className="w-3.5 h-3.5 text-blue-500" />
                <span>Active Catalog</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  catalogSubTab === "active"
                    ? isDark
                      ? "bg-slate-700 text-slate-200"
                      : "bg-slate-100 text-slate-900 border border-slate-300"
                    : isDark
                    ? "bg-slate-800 text-slate-400"
                    : "bg-slate-300 text-slate-700"
                }`}>
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setCatalogSubTab("recycle_bin")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  catalogSubTab === "recycle_bin"
                    ? "bg-red-600 text-white shadow-sm"
                    : isDark
                    ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    : "text-slate-700 hover:text-red-600 hover:bg-red-500/10"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Recycle Bin</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  catalogSubTab === "recycle_bin"
                    ? "bg-white/20 text-white"
                    : recycleBin.length > 0
                    ? "bg-red-600 text-white shadow-sm"
                    : isDark
                    ? "bg-slate-800 text-slate-400"
                    : "bg-slate-300 text-slate-700"
                }`}>
                  {recycleBin.length}
                </span>
              </button>
            </div>

            {catalogSubTab === "active" ? (
              /* Inventory Table with Fast Filters */
              <div className={`${cardClass} border rounded-3xl p-5 space-y-4`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                  isDark ? "border-slate-800" : "border-slate-200"
                }`}>
                  <div className="relative flex-1 w-full sm:min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="text"
                      placeholder="Search accessories by name, SKU, location, brand..."
                      value={invSearch}
                      onChange={(e) => setInvSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${inputClass}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 text-xs font-mono w-full sm:w-auto">
                    <select
                      value={selectedBrandFilter || "all"}
                      onChange={(e) => setSelectedBrandFilter(e.target.value === "all" ? null : e.target.value)}
                      className={`px-3 py-1.5 rounded-xl border text-xs ${inputClass}`}
                    >
                      <option value="all">All Brands ({brands.length})</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[720px]">
                    <thead>
                      <tr className={`border-b font-mono uppercase text-[10px] tracking-wider ${
                        isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-600 bg-slate-50/60"
                      }`}>
                        <th className="py-2.5 px-3">Item & Photos</th>
                        <th className="py-2.5 px-3">Make / Model</th>
                        <th className="py-2.5 px-3">Compatible Years</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3 text-right">Catalog Price</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-200"}`}>
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className={`transition ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={getDisplayImageUrl(item.imageUrl || (item.images && item.images[0]))}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover bg-slate-950 shrink-0"
                              />
                              <div className="max-w-xs">
                                <Link
                                  href={`/products/${item.id}`}
                                  target="_blank"
                                  className="font-bold hover:text-red-500 line-clamp-1 flex items-center gap-1"
                                >
                                  <span>{item.name}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                                </Link>
                                <div className="text-[10px] opacity-60 font-mono flex items-center gap-2">
                                  <span>{item.category}</span>
                                  <span>•</span>
                                  <span>{item.images?.length || 1} Images</span>
                                  {item.videoUrl && <span className="text-red-500 font-bold">• 1 Video</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <div className="font-bold">{item.brand}</div>
                            <div className="text-[10px] opacity-60">{item.subbrand}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px]">
                            {Array.isArray(item.compatibleYears) && item.compatibleYears.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1 max-w-[160px]">
                                {item.compatibleYears.slice(0, 3).map((yr, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                      isDark
                                        ? "bg-slate-800 text-slate-200 border-slate-700"
                                        : "bg-slate-100 text-slate-800 border-slate-300"
                                    }`}
                                  >
                                    {yr}
                                  </span>
                                ))}
                                {item.compatibleYears.length > 3 && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      isDark
                                        ? "bg-slate-800 text-slate-400"
                                        : "bg-slate-200 text-slate-700 border border-slate-300"
                                    }`}
                                  >
                                    +{item.compatibleYears.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-300"
                              }`}>
                                All Years
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono opacity-70">{item.sku}</td>

                          <td className="py-3 px-3 text-right font-mono font-bold">
                            ₹{item.price?.toLocaleString("en-IN")}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditProductModal(item)}
                                className={`p-1.5 rounded-lg transition ${
                                  isDark
                                    ? "hover:bg-slate-800 text-slate-300"
                                    : "hover:bg-slate-100 text-slate-600"
                                }`}
                                title="Edit Accessory"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => triggerDeletePart(item)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition"
                                title="Delete Part (Move to Recycle Bin)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* TAB CONTENT: RECYCLE BIN */
              <div className={`${cardClass} border rounded-3xl p-5 space-y-4`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                  isDark ? "border-slate-800" : "border-slate-200"
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <h3 className="font-bold text-sm">Recycle Bin ({recycleBin.length} items)</h3>
                    </div>
                    <p className="text-[11px] opacity-60 mt-0.5">
                      Items here are hidden from the store catalog. They can be recovered anytime, or permanently purged manually by admin.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedRecycleIds.length > 0 && (
                      <>
                        <button
                          onClick={handleBulkRestoreSelected}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition border ${
                            isDark
                              ? "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                              : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Restore Selected ({selectedRecycleIds.length})</span>
                        </button>
                        <button
                          onClick={triggerBulkDeleteSelected}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition ${
                            isDark
                              ? "bg-red-600/15 hover:bg-red-600/25 text-red-400 border-red-500/30"
                              : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-300"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Delete Selected Forever</span>
                        </button>
                      </>
                    )}

                    {(recycleSearch || recycleBrandFilter || recycleCategoryFilter) && filteredRecycleBin.length > 0 && (
                      <>
                        <button
                          onClick={handleBulkRestoreFiltered}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition ${
                            isDark
                              ? "bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300"
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore Filtered ({filteredRecycleBin.length})</span>
                        </button>
                        <button
                          onClick={triggerDeleteFiltered}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition ${
                            isDark
                              ? "bg-red-600/15 hover:bg-red-600/30 text-red-400 border-red-500/40"
                              : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-300"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Filtered Forever ({filteredRecycleBin.length})</span>
                        </button>
                      </>
                    )}

                    {recycleBin.length > 0 && (
                      <button
                        onClick={triggerEmptyRecycleBin}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Empty Recycle Bin</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Search & Filters for Recycle Bin */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                  isDark ? "border-slate-800" : "border-slate-200"
                }`}>
                  <div className="relative flex-1 w-full sm:min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="text"
                      placeholder="Search deleted items by name, SKU, brand..."
                      value={recycleSearch}
                      onChange={(e) => setRecycleSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${inputClass}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 text-xs font-mono w-full sm:w-auto">
                    <select
                      value={recycleBrandFilter || "all"}
                      onChange={(e) => setRecycleBrandFilter(e.target.value === "all" ? null : e.target.value)}
                      className={`px-3 py-1.5 rounded-xl border text-xs ${inputClass}`}
                    >
                      <option value="all">All Brands</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={recycleCategoryFilter || "all"}
                      onChange={(e) => setRecycleCategoryFilter(e.target.value === "all" ? null : e.target.value)}
                      className={`px-3 py-1.5 rounded-xl border text-xs ${inputClass}`}
                    >
                      <option value="all">All Categories</option>
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    {recycleBin.length > 0 && (
                      <button
                        onClick={() => {
                          if (selectedRecycleIds.length === filteredRecycleBin.length) {
                            setSelectedRecycleIds([]);
                          } else {
                            setSelectedRecycleIds(filteredRecycleBin.map((p) => p.id));
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition ${
                          isDark
                            ? "border-slate-700 hover:bg-slate-800 text-slate-300"
                            : "border-slate-300 hover:bg-slate-100 text-slate-700 bg-white"
                        }`}
                      >
                        {selectedRecycleIds.length === filteredRecycleBin.length && filteredRecycleBin.length > 0 ? (
                          <CheckSquare className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <Square className="w-3.5 h-3.5 opacity-60" />
                        )}
                        <span className="text-[11px] font-medium">
                          {selectedRecycleIds.length === filteredRecycleBin.length && filteredRecycleBin.length > 0
                            ? "Deselect All"
                            : "Select All"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Recycle Bin Table */}
                {filteredRecycleBin.length === 0 ? (
                  <div className="py-16 text-center space-y-3 opacity-60">
                    <Archive className="w-12 h-12 mx-auto stroke-1" />
                    <p className="text-sm font-semibold">
                      {recycleBin.length === 0
                        ? "Recycle Bin is empty"
                        : "No deleted items match the selected filter"}
                    </p>
                    <p className="text-xs max-w-sm mx-auto">
                      {recycleBin.length === 0
                        ? "When items are deleted from the catalog, they appear here before permanent removal."
                        : "Try clearing search or filters to see all deleted items."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[720px]">
                      <thead>
                        <tr className={`border-b font-mono uppercase text-[10px] tracking-wider ${
                          isDark
                            ? "border-slate-800 text-slate-400"
                            : "border-slate-200 text-slate-600 bg-slate-50/60"
                        }`}>
                          <th className="py-2.5 px-3 w-8">
                            <input
                              type="checkbox"
                              checked={selectedRecycleIds.length === filteredRecycleBin.length && filteredRecycleBin.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecycleIds(filteredRecycleBin.map((p) => p.id));
                                } else {
                                  setSelectedRecycleIds([]);
                                }
                              }}
                              className="rounded border-slate-400 text-red-600"
                            />
                          </th>
                          <th className="py-2.5 px-3">Deleted Item</th>
                          <th className="py-2.5 px-3">Make / Model</th>
                          <th className="py-2.5 px-3">SKU & Category</th>
                          <th className="py-2.5 px-3 text-right">Price</th>
                          <th className="py-2.5 px-3">Deleted Date</th>
                          <th className="py-2.5 px-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-200"}`}>
                        {filteredRecycleBin.map((item) => {
                          const isSelected = selectedRecycleIds.includes(item.id);
                          return (
                            <tr
                              key={item.id}
                              className={`transition ${
                                isDark
                                  ? isSelected ? "bg-red-500/10" : "hover:bg-slate-800/40"
                                  : isSelected ? "bg-red-50" : "hover:bg-slate-50"
                              }`}
                            >
                              <td className="py-3 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRecycleIds((prev) => [...prev, item.id]);
                                    } else {
                                      setSelectedRecycleIds((prev) => prev.filter((id) => id !== item.id));
                                    }
                                  }}
                                  className="rounded border-slate-400 text-red-600"
                                />
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={getDisplayImageUrl(item.imageUrl || (item.images && item.images[0]))}
                                    alt={item.name}
                                    className="w-10 h-10 rounded-xl object-cover bg-slate-950 shrink-0 opacity-70 grayscale hover:grayscale-0 transition"
                                  />
                                  <div className="max-w-xs">
                                    <div className="font-bold line-clamp-1 opacity-90">{item.name}</div>
                                    <div className="text-[10px] opacity-60 font-mono">{item.location}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-mono">
                                <div className="font-bold">{item.brand}</div>
                                <div className="text-[10px] opacity-60">{item.subbrand}</div>
                              </td>
                              <td className="py-3 px-3 font-mono">
                                <div className="font-bold">{item.sku}</div>
                                <div className="text-[10px] opacity-60">{item.category}</div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold">
                                ₹{item.price?.toLocaleString("en-IN")}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] opacity-70">
                                {item.deletedAt ? new Date(item.deletedAt).toLocaleString("en-IN", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }) : "Recently"}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleRestoreFromRecycleBin(item)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                                      isDark
                                        ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300"
                                    }`}
                                    title="Restore to Active Catalog"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Restore</span>
                                  </button>
                                  <button
                                    onClick={() => triggerPermanentDelete(item)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                                      isDark
                                        ? "hover:bg-red-500/10 text-red-400"
                                        : "hover:bg-red-50 text-red-600 border border-red-200"
                                    }`}
                                    title="Delete Permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Forever</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ADD / EDIT PRODUCT MODAL */}
            {showProductModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
                <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto`}>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-base">
                        {editingProduct ? `Edit Accessory: ${editingProduct.name}` : "Add New Studio Accessory"}
                      </h3>
                      <p className="text-xs opacity-60">
                        Full PDP controls: Dynamic Make & Model, Multi-Year Selector, 5-6 Photos, Video Slot, and Bay Specs.
                      </p>
                    </div>
                    <button onClick={() => setShowProductModal(false)} className="opacity-60 hover:opacity-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProductModal} className="space-y-4 text-xs font-mono">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Product Name */}
                      <div className="sm:col-span-2">
                        <label className="block mb-1 opacity-70">Accessory Name *</label>
                        <input
                          type="text"
                          required
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          placeholder="e.g. ApexPro 8-Channel DSP Amplifier with 31-Band EQ"
                          className={`w-full px-3.5 py-2 rounded-xl border font-sans text-xs ${inputClass}`}
                        />
                      </div>

                      {/* Dynamic Car Make / Brand with [+ Add New Brand] button */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="opacity-70 font-bold">Car Make / Brand *</label>
                          <button
                            type="button"
                            onClick={() => setInlineNewBrand(!inlineNewBrand)}
                            className="text-[10px] text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add New Brand</span>
                          </button>
                        </div>

                        {inlineNewBrand ? (
                          <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-red-500/30 bg-red-500/5">
                            <input
                              type="text"
                              placeholder="New Brand (e.g. Porsche)..."
                              value={inlineBrandName}
                              onChange={(e) => setInlineBrandName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleInlineSaveBrand();
                                }
                              }}
                              className={`flex-1 px-2.5 py-1 rounded-lg border text-xs ${inputClass}`}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleInlineSaveBrand}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineNewBrand(false)}
                              className="p-1 opacity-60 hover:opacity-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <select
                            value={productForm.brand}
                            onChange={(e) => {
                              const newBrand = e.target.value;
                              const bObj = brands.find((b) => b.name === newBrand);
                              const firstSub = bObj?.subbrands[0]
                                ? typeof bObj.subbrands[0] === "string"
                                  ? bObj.subbrands[0]
                                  : bObj.subbrands[0].name
                                : "";
                              setProductForm({ ...productForm, brand: newBrand, subbrand: firstSub });
                            }}
                            className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                          >
                            {brands.map((b) => (
                              <option key={b.id} value={b.name}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Dynamic Model / Subbrand with [+ Add New Model] button (Routes to this brand only!) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="opacity-70 font-bold">
                            Model / Subbrand ({productForm.brand}) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setInlineNewModel(!inlineNewModel)}
                            className="text-[10px] text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add New Model</span>
                          </button>
                        </div>

                        {inlineNewModel ? (
                          <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-red-500/30 bg-red-500/5">
                            <input
                              type="text"
                              placeholder={`New Model for ${productForm.brand}...`}
                              value={inlineModelName}
                              onChange={(e) => setInlineModelName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleInlineSaveModel();
                                }
                              }}
                              className={`flex-1 px-2.5 py-1 rounded-lg border text-xs ${inputClass}`}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleInlineSaveModel}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineNewModel(false)}
                              className="p-1 opacity-60 hover:opacity-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <select
                            value={productForm.subbrand}
                            onChange={(e) => setProductForm({ ...productForm, subbrand: e.target.value })}
                            className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                          >
                            {availableModelsForSelectedBrand.length > 0 ? (
                              availableModelsForSelectedBrand.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))
                            ) : (
                              <option value="">No models yet (Click &quot;Add New Model&quot;)</option>
                            )}
                          </select>
                        )}
                      </div>

                      {/* Multi-Year Selection with [+ Add Year] */}
                      <div className="sm:col-span-2 space-y-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="font-bold opacity-80 text-xs">
                            Compatible Model Years (Multi-Select) *
                          </label>
                          <div className="flex items-center gap-2 text-[10px]">
                            <button
                              type="button"
                              onClick={handleSelectAllYears}
                              className="text-red-500 hover:underline font-bold"
                            >
                              Select All
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={handleClearYears}
                              className="opacity-50 hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {allAvailableYears.map((yr) => {
                            const isSelected = productForm.compatibleYears.includes(yr);
                            return (
                              <button
                                key={yr}
                                type="button"
                                onClick={() => toggleYear(yr)}
                                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition ${
                                  isSelected
                                    ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 opacity-60 hover:opacity-100"
                                }`}
                              >
                                {yr} {isSelected ? "✓" : ""}
                              </button>
                            );
                          })}

                          {/* [+ Add Any Year] Inline Input */}
                          {showAddYearInput ? (
                            <div className="inline-flex items-center gap-1 p-0.5 rounded-xl border border-red-500/40 bg-red-500/5">
                              <input
                                type="text"
                                placeholder="e.g. 2026"
                                value={newYearInput}
                                onChange={(e) => setNewYearInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddCustomYear();
                                  }
                                }}
                                className={`w-20 px-2 py-0.5 rounded-lg border text-xs font-mono ${inputClass}`}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomYear}
                                className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-bold"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAddYearInput(false)}
                                className="p-1 opacity-60 hover:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowAddYearInput(true)}
                              className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold border border-dashed border-red-500/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Year</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] opacity-50">
                          Selected: {productForm.compatibleYears.join(", ") || "None"}
                        </p>
                      </div>

                      {/* Category with [+ Add New Category] button */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="opacity-70 font-bold">Category *</label>
                          <button
                            type="button"
                            onClick={() => setInlineNewCategory(!inlineNewCategory)}
                            className="text-[10px] text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add New Category</span>
                          </button>
                        </div>

                        {inlineNewCategory ? (
                          <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-red-500/30 bg-red-500/5">
                            <input
                              type="text"
                              placeholder="New Category (e.g. Performance)..."
                              value={inlineCategoryName}
                              onChange={(e) => setInlineCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleInlineSaveCategory();
                                }
                              }}
                              className={`flex-1 px-2.5 py-1 rounded-lg border text-xs ${inputClass}`}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleInlineSaveCategory}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineNewCategory(false)}
                              className="p-1 opacity-60 hover:opacity-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <select
                            value={productForm.category}
                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                            className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                          >
                            {allCategoryOptions.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* SKU */}
                      <div>
                        <label className="block mb-1 opacity-70">SKU / Code *</label>
                        <input
                          type="text"
                          required
                          value={productForm.sku}
                          onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                          className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      {/* Badge & Warranty */}
                      <div>
                        <label className="block mb-1 opacity-70">Badge on Card / PDP</label>
                        <input
                          type="text"
                          value={productForm.badge}
                          onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                          placeholder="e.g. Studio Signature / OEM Coupler"
                          className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      {/* Warranty Selector: Days, Months, Year */}
                      <div>
                        <label className="block mb-1 opacity-70 font-bold">Warranty Duration *</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={productForm.warrantyValue}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value) || 1);
                              setProductForm({ ...productForm, warrantyValue: val });
                            }}
                            placeholder="e.g. 1"
                            className={`w-28 px-3.5 py-2 rounded-xl border font-mono ${inputClass}`}
                          />
                          <select
                            value={productForm.warrantyUnit}
                            onChange={(e) => setProductForm({ ...productForm, warrantyUnit: e.target.value as "days" | "months" | "years" })}
                            className={`flex-1 px-3.5 py-2 rounded-xl border font-mono ${inputClass}`}
                          >
                            <option value="days">Days</option>
                            <option value="months">Months</option>
                            <option value="years">Year / Years</option>
                          </select>
                        </div>
                        <p className="text-[10px] opacity-50 mt-1">
                          Enters as: {productForm.warrantyValue} {
                            productForm.warrantyUnit === "days"
                              ? (productForm.warrantyValue === 1 ? "Day" : "Days")
                              : productForm.warrantyUnit === "years"
                              ? (productForm.warrantyValue === 1 ? "Year" : "Years")
                              : (productForm.warrantyValue === 1 ? "Month" : "Months")
                          }
                        </p>
                      </div>

                      {/* Reference Price & Location */}
                      <div>
                        <label className="block mb-1 opacity-70">Catalog Ref Price (₹)</label>
                        <input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                          className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">Studio Bay Location</label>
                        <input
                          type="text"
                          value={productForm.location}
                          onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                          placeholder="Studio Bay A-1"
                          className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      {/* 5-6 Product Image Slots */}
                      <div className="sm:col-span-2 space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="font-bold block opacity-90 text-xs">
                            Product Images (5 Slots — Telegram CDN Integrated)
                          </span>
                          <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                            Global CDN Active
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {productForm.images.map((img, i) => (
                            <div key={i} className={`p-2.5 rounded-xl border ${innerCardClass} space-y-1.5`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold opacity-60">
                                  Slot #{i + 1} {i === 0 ? "(Primary Thumbnail)" : ""}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {img && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newImgs = [...productForm.images];
                                        newImgs[i] = "";
                                        setProductForm({ ...productForm, images: newImgs });
                                      }}
                                      className="text-[10px] text-red-500 hover:text-red-400 font-mono"
                                    >
                                      Clear
                                    </button>
                                  )}
                                  <label className="cursor-pointer px-2 py-0.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-bold flex items-center gap-1 transition">
                                    <Camera className="w-2.5 h-2.5" />
                                    <span>{uploadingSlot === i ? "Uploading..." : "Upload to Telegram"}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      disabled={uploadingSlot === i}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleUploadSlot(i, f);
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {img ? (
                                  <img
                                    src={getDisplayImageUrl(img)}
                                    alt={`Slot ${i + 1}`}
                                    className="w-8 h-8 rounded-lg object-cover bg-black shrink-0 border border-slate-300 dark:border-slate-700"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center opacity-40">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                )}
                                <input
                                  type="text"
                                  placeholder="URL or /api/images/[id]"
                                  value={img}
                                  onChange={(e) => {
                                    const newImgs = [...productForm.images];
                                    newImgs[i] = e.target.value;
                                    setProductForm({ ...productForm, images: newImgs });
                                  }}
                                  className={`flex-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono ${inputClass}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Video Player URL */}
                      <div className="sm:col-span-2">
                        <label className="block mb-1 opacity-70">
                          Dedicated Video Player URL (Final Media Slide on PDP)
                        </label>
                        <input
                          type="text"
                          placeholder="https://.../video.mp4"
                          value={productForm.videoUrl}
                          onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })}
                          className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      {/* Installation Bay Time & What's In Box */}
                      <div>
                        <label className="block mb-1 opacity-70">Installation Bay Time Estimate</label>
                        <input
                          type="text"
                          value={productForm.bayTime}
                          onChange={(e) => setProductForm({ ...productForm, bayTime: e.target.value })}
                          placeholder="e.g. 60–90 Mins Bay Time"
                          className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">What&apos;s In The Box Contents</label>
                        <input
                          type="text"
                          value={productForm.whatsInBox}
                          onChange={(e) => setProductForm({ ...productForm, whatsInBox: e.target.value })}
                          placeholder="1x Unit, 1x Coupler Harness, 1x Card"
                          className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      {/* Description */}
                      <div className="sm:col-span-2">
                        <label className="block mb-1 opacity-70">Description</label>
                        <textarea
                          rows={2}
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          className={`w-full px-3.5 py-2 rounded-xl border font-sans text-xs ${inputClass}`}
                        />
                      </div>

                      {/* Technical Specs */}
                      <div className="sm:col-span-2">
                        <label className="block mb-1 opacity-70">
                          Technical Specifications (Format: Key: Value per line)
                        </label>
                        <textarea
                          rows={3}
                          value={productForm.specs}
                          onChange={(e) => setProductForm({ ...productForm, specs: e.target.value })}
                          placeholder="Wiring: OEM Plug & Play Coupler&#10;Resolution: 1920x720 QLED&#10;Processor: Octa-Core"
                          className={`w-full px-3.5 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowProductModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
                      >
                        {editingProduct ? "Update Accessory" : "Add to Catalog"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: ENQUIRIES & QUOTATIONS (Available to Both Admin & Staff)   */}
        {/* ================================================================= */}
        {activeTab === "enquiries" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Customer Enquiries & Quotation Desk</h2>
                <p className="text-xs opacity-60 mt-0.5">
                  Click on an enquiry to open the Quotation Pricing Desk, configure component prices & labor, and dispatch official links to customers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {enquiries.filter((q) => !q.isPriced).length} Pending Pricing
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Enquiries List */}
              <div className={`lg:col-span-5 ${cardClass} border rounded-3xl p-5 space-y-3`}>
                <span className="font-mono text-xs font-bold uppercase tracking-wider opacity-60 block pb-2 border-b border-slate-200 dark:border-slate-800">
                  All Quotation Requests ({enquiries.length})
                </span>

                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {enquiries.map((q) => {
                    const isSelected = selectedEnquiry?.id === q.id;

                    return (
                      <div
                        key={q.id}
                        onClick={() => openEnquiryPricingDesk(q)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? "border-red-500 shadow-md bg-red-500/5"
                            : `${innerCardClass} hover:border-slate-400`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold">{q.customerName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              q.isPriced
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                            }`}
                          >
                            {q.isPriced ? "PRICED & DISPATCHED" : "PENDING PRICING"}
                          </span>
                        </div>

                        <div className="text-[11px] opacity-70 font-mono">
                          {q.vehicleBrand} {q.vehicleModel} • {q.items?.length || 0} Components
                        </div>

                        <div className="flex items-center justify-between text-[10px] opacity-50 font-mono pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span>Ref: {q.id}</span>
                          <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quotation Pricing Desk */}
              <div id="quotation-pricing-desk" className={`lg:col-span-7 ${cardClass} border rounded-3xl p-5 sm:p-7 space-y-6 scroll-mt-28`}>
                {selectedEnquiry ? (
                  <div className="space-y-6">
                    
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold">Quotation Desk</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/30">
                            {selectedEnquiry.id}
                          </span>
                        </div>
                        <div className="text-xs opacity-70 mt-1 font-mono">
                          Client: <strong>{selectedEnquiry.customerName}</strong> ({selectedEnquiry.customerPhone}) • Vehicle: {selectedEnquiry.vehicleBrand} {selectedEnquiry.vehicleModel}
                        </div>
                      </div>

                      <Link
                        href={`/quotation?id=${selectedEnquiry.id}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Client View</span>
                      </Link>
                    </div>

                    {quoteSavedSuccess && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center justify-between font-mono">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Quotation priced and saved in database! Ready for client dispatch.</span>
                        </div>
                      </div>
                    )}

                    {/* Component Pricing Form */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60 block">
                        Set Component Prices & Installation Charges
                      </span>

                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {pricingItems.map((item, idx) => (
                          <div key={idx} className={`p-3.5 rounded-2xl border ${innerCardClass} space-y-2`}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs truncate max-w-sm">
                                {idx + 1}. {item.name}
                              </span>
                              <span className="text-[11px] font-mono opacity-60">Qty: {item.quantity}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="block text-[10px] font-mono opacity-60 mb-1">
                                  Unit Price (₹)
                                </label>
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPricingItems((prev) =>
                                      prev.map((it, i) => (i === idx ? { ...it, unitPrice: val } : it))
                                    );
                                  }}
                                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono ${inputClass}`}
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono opacity-60 mb-1">
                                  Installation Charges (₹)
                                </label>
                                <input
                                  type="number"
                                  value={item.installationCharge ?? item.laborCharge ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPricingItems((prev) =>
                                      prev.map((it, i) => (i === idx ? { ...it, installationCharge: val, laborCharge: val } : it))
                                    );
                                  }}
                                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono ${inputClass}`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary Calculation */}
                    <div className={`p-4 rounded-2xl border ${innerCardClass} space-y-2.5 font-mono text-xs`}>
                      <div className="flex justify-between opacity-80">
                        <span>Components Subtotal:</span>
                        <span className="font-bold">₹{quoteSubtotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="opacity-80">Installation Charges (₹):</span>
                          {customInstallationCharge !== null && (
                            <button
                              type="button"
                              onClick={() => setCustomInstallationCharge(null)}
                              className="text-[9px] font-mono text-blue-500 hover:underline cursor-pointer"
                              title={`Reset to component sum (₹${itemsInstallationSum.toLocaleString("en-IN")})`}
                            >
                              (Reset Auto)
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          value={quoteInstallationTotal}
                          onChange={(e) => setCustomInstallationCharge(Math.max(0, Number(e.target.value)))}
                          className={`w-32 px-2.5 py-1 rounded-lg border text-right text-xs font-bold ${inputClass}`}
                          title="Enter custom total installation charges or set per-item charges above"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="opacity-80">Studio Discount (₹):</span>
                        <input
                          type="number"
                          value={quoteDiscount}
                          onChange={(e) => setQuoteDiscount(Number(e.target.value))}
                          className={`w-32 px-2.5 py-1 rounded-lg border text-right text-xs text-emerald-500 font-bold ${inputClass}`}
                        />
                      </div>

                      {/* GST Toggle and Custom Rate */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="opacity-80">GST Calculation:</span>
                          <button
                            type="button"
                            onClick={() => setIsGstEnabled((prev) => !prev)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer ${
                              isGstEnabled
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                            }`}
                          >
                            {isGstEnabled ? "ENABLED" : "EXEMPTED / OFF"}
                          </button>
                        </div>
                        {isGstEnabled ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] opacity-70">Rate (%):</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={customGstRate}
                              onChange={(e) => setCustomGstRate(Number(e.target.value))}
                              className={`w-16 px-2 py-0.5 rounded-lg border text-right text-xs font-bold ${inputClass}`}
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-500 font-bold">₹0 (Exempted)</span>
                        )}
                      </div>

                      {isGstEnabled && (
                        <div className="flex justify-between opacity-80">
                          <span>GST ({customGstRate}%):</span>
                          <span className="font-bold">₹{quoteGst.toLocaleString("en-IN")}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-black">
                        <span>GRAND TOTAL:</span>
                        <span className="text-red-500">₹{quoteGrandTotal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Dispatch & Save Actions */}
                    <div className="space-y-2.5 pt-2">
                      <button
                        onClick={handleSaveAndFinalizeQuotation}
                        disabled={savingQuote}
                        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold uppercase tracking-wider text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {savingQuote ? (
                          <span>SAVING & FINALIZING QUOTATION...</span>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>SAVE & FINALIZE QUOTATION</span>
                          </>
                        )}
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          onClick={handleShareQuoteWhatsApp}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span>Dispatch WhatsApp</span>
                        </button>

                        <button
                          onClick={handleOpenPrintQuote}
                          className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Print official quotation matching customer bill"
                        >
                          <Printer className="w-4 h-4 shrink-0" />
                          <span>Print Quotation</span>
                        </button>

                        <button
                          onClick={handleCopyQuoteLink}
                          className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {copiedLink ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <Share2 className="w-4 h-4 shrink-0" />}
                          <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="py-20 text-center opacity-50 font-mono text-xs">
                    Select a quotation request from the list to set prices and dispatch to client.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: WARRANTY MANAGER (View All & Register New - Admin & Staff) */}
        {/* ================================================================= */}
        {activeTab === "warranties" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Studio Warranty Management</h2>
                <p className="text-xs opacity-60 mt-0.5">
                  View all digitally registered warranties and issue new digital warranty certificates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRegisterWarrantyModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Warranty</span>
                </button>
              </div>
            </div>

            {/* Warranties Table */}
            <div className={`${cardClass} border rounded-3xl p-5 space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="relative flex-1 w-full max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search by customer, phone, reg no, serial number..."
                    value={warrantySearch}
                    onChange={(e) => setWarrantySearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${inputClass}`}
                  />
                </div>

                <div className="text-xs font-mono opacity-70 shrink-0">
                  Total Active: {warranties.length} Warranties
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 opacity-60 font-mono uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Cert ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Vehicle Reg</th>
                      <th className="py-2.5 px-3">Fitted Product & Serial</th>
                      <th className="py-2.5 px-3">Fitment Date</th>
                      <th className="py-2.5 px-3">Expiry Date</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredWarranties.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-red-500">{w.id}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold">{w.customerName}</div>
                          <div className="text-[10px] opacity-60 font-mono">{w.customerPhone}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">{w.vehicleRegNo}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold line-clamp-1">{w.productName}</div>
                          <div className="text-[10px] opacity-60 font-mono">SN: {w.serialNumber} • Inv: {w.invoiceNo}</div>
                        </td>
                        <td className="py-3 px-3 font-mono opacity-70">
                          {new Date(w.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-500">
                          {new Date(w.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            {w.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* REGISTER NEW WARRANTY MODAL */}
            {showRegisterWarrantyModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
                <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto`}>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-base">Issue & Register Digital Warranty</h3>
                      <p className="text-xs opacity-60">Generate an official digital warranty certificate for customer fitment.</p>
                    </div>
                    <button onClick={() => setShowRegisterWarrantyModal(false)} className="opacity-60 hover:opacity-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleRegisterNewWarranty} className="space-y-3.5 text-xs font-mono">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 opacity-70">Client Name *</label>
                        <input
                          type="text"
                          required
                          value={newWarrantyForm.customerName}
                          onChange={(e) => setNewWarrantyForm({ ...newWarrantyForm, customerName: e.target.value })}
                          placeholder="e.g. John Doe"
                          className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={newWarrantyForm.customerPhone}
                          onChange={(e) => setNewWarrantyForm({ ...newWarrantyForm, customerPhone: e.target.value })}
                          placeholder="9876543210"
                          className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">Vehicle Registration No *</label>
                        <input
                          type="text"
                          required
                          value={newWarrantyForm.vehicleRegNo}
                          onChange={(e) => setNewWarrantyForm({ ...newWarrantyForm, vehicleRegNo: e.target.value })}
                          placeholder="KA-05-MB-1234"
                          className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">Invoice Reference *</label>
                        <input
                          type="text"
                          required
                          value={newWarrantyForm.invoiceNo}
                          onChange={(e) => setNewWarrantyForm({ ...newWarrantyForm, invoiceNo: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block mb-1 opacity-70">Fitted Accessory / Product *</label>
                        <input
                          type="text"
                          required
                          value={newWarrantyForm.productName}
                          onChange={(e) => setNewWarrantyForm({ ...newWarrantyForm, productName: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">Component Serial Number *</label>
                        <input
                          type="text"
                          required
                          value={newWarrantyForm.serialNumber}
                          onChange={(e) => setNewWarrantyForm({ ...newWarrantyForm, serialNumber: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">Warranty Duration</label>
                        <select
                          value={newWarrantyForm.warrantyMonths}
                          onChange={(e) => setNewWarrantyForm({ ...newWarrantyForm, warrantyMonths: Number(e.target.value) })}
                          className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                        >
                          <option value={12}>12 Months (1 Year)</option>
                          <option value={18}>18 Months (1.5 Years)</option>
                          <option value={24}>24 Months (2 Years)</option>
                          <option value={36}>36 Months (3 Years)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">Fitment Date</label>
                        <input
                          type="date"
                          value={newWarrantyForm.purchaseDate}
                          onChange={(e) => setNewWarrantyForm({ ...newWarrantyForm, purchaseDate: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>

                      <div>
                        <label className="block mb-1 opacity-70">Studio Location</label>
                        <input
                          type="text"
                          value={newWarrantyForm.studioLocation}
                          onChange={(e) => setNewWarrantyForm({ ...newWarrantyForm, studioLocation: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRegisterWarrantyModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={registeringWarranty}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        {registeringWarranty ? "Registering..." : "Generate Warranty Certificate"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4.5: BRANDS & MODELS ARCHITECTURE (Admin Only)                */}
        {/* ================================================================= */}
        {activeTab === "brands" && authRole === "admin" && (
          <div className="space-y-6">
            {/* Header & Quick Add Brand */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Vehicle Brands & Models Architecture
                </h2>
                <p className="text-xs opacity-60 mt-0.5">
                  Manage brand logos for Brand Cards and vehicle model photos for Model Cards displayed on the storefront.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowArrangeBrandsModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition self-start sm:self-auto cursor-pointer active:scale-95"
                  title="Arrange brand display order on the storefront homepage"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Arrange Brand Order</span>
                </button>

                <button
                  onClick={() => setShowAddBrandModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Brand</span>
                </button>
              </div>
            </div>

            {/* Sub-Tab Navigation: Active Vehicles vs Vehicle Recycle Bin */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none no-scrollbar">
              <button
                onClick={() => setBrandSubTab("active")}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 whitespace-nowrap ${
                  brandSubTab === "active"
                    ? "bg-red-600 text-white shadow-md"
                    : `${cardClass} border hover:border-slate-400 dark:hover:border-slate-700 opacity-80 hover:opacity-100`
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Active Vehicles</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  brandSubTab === "active" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}>
                  {activeBrands.length} Brands • {activeModelsCount} Models
                </span>
              </button>

              <button
                onClick={() => setBrandSubTab("recycle_bin")}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition shrink-0 whitespace-nowrap ${
                  brandSubTab === "recycle_bin"
                    ? "bg-red-600 text-white shadow-md"
                    : `${cardClass} border hover:border-slate-400 dark:hover:border-slate-700 opacity-80 hover:opacity-100`
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Vehicle Recycle Bin</span>
                {totalVehicleRecycleCount > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    brandSubTab === "recycle_bin" ? "bg-white text-red-600" : "bg-red-600 text-white"
                  }`}>
                    {totalVehicleRecycleCount}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono opacity-50">
                    0
                  </span>
                )}
              </button>
            </div>

            {/* SUB-TAB 1: ACTIVE VEHICLES */}
            {brandSubTab === "active" && (
              <div className="space-y-6">
                {/* Search Bar for Brands, Models, and Compatible Years */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-xl">
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Search car brands, models, or compatible years (e.g. Fortuner, Creta, BMW, 2024)..."
                      className={`w-full pl-10 pr-9 py-2.5 rounded-2xl border text-xs sm:text-sm ${inputClass} shadow-sm`}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    {brandSearch && (
                      <button
                        onClick={() => setBrandSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {brandSearch && (
                    <div className="text-xs font-mono opacity-60">
                      Showing {filteredActiveBrands.length} of {activeBrands.length} brands
                    </div>
                  )}
                </div>

                {/* Master-Detail Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: All Active Brands Grid */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
                        <Car className="w-4 h-4 text-red-500" />
                        <span>Car Brands ({filteredActiveBrands.length})</span>
                      </h3>
                      <span className="text-[11px] opacity-60 font-mono">
                        Click brand to manage models
                      </span>
                    </div>

                    <div className="space-y-3">
                      {filteredActiveBrands.length > 0 ? (
                        filteredActiveBrands.map((b) => {
                          const isSelected = (selectedBrandForModels?.id || filteredActiveBrands[0]?.id) === b.id;
                          const brandLogo = b.logo ? getDisplayImageUrl(b.logo) : null;
                          const activeModels = (b.subbrands || []).filter((s: any) => !s.isDeleted);
                          const modelsCount = activeModels.length;
                          const itemsCount = products.filter(
                            (p) => !p.isDeleted && p.brand.toLowerCase() === b.name.toLowerCase()
                          ).length;
                          const actualRankIdx = activeBrands.findIndex((x) => x.id === b.id);
                          const isFirst = actualRankIdx === 0;

                          return (
                            <div
                              key={b.id}
                              onClick={() => {
                                setSelectedBrandForModels(b);
                                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                                  setTimeout(() => {
                                    document.getElementById("brand-models-view")?.scrollIntoView({ behavior: "smooth" });
                                  }, 100);
                                }
                              }}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group ${
                                isSelected
                                  ? "bg-red-600/10 border-red-500 shadow-md ring-1 ring-red-500"
                                  : `${cardClass} border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700`
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {/* Logo container with rank pill */}
                                <div className="relative w-14 h-14 rounded-xl bg-white p-2 flex items-center justify-center shrink-0 shadow-sm border border-slate-200 overflow-hidden">
                                  {brandLogo ? (
                                    <img
                                      src={brandLogo}
                                      alt={b.name}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-xs font-black text-slate-800 uppercase font-mono">
                                      {b.name.slice(0, 3)}
                                    </span>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-sm truncate group-hover:text-red-500 transition-colors">
                                      {b.name}
                                    </h4>
                                    {isFirst ? (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-amber-500 text-slate-950 shadow-xs flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        <span>1st on Homepage</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        #{actualRankIdx + 1}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs opacity-60 font-mono mt-0.5">
                                    {modelsCount} Models • {itemsCount} Accessories
                                  </p>
                                </div>
                              </div>

                              {/* Actions & Reordering Controls */}
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                                {/* Quick Make 1st Button */}
                                {!isFirst && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetBrandFirst(b.id, b.name)}
                                    className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-extrabold bg-amber-500/15 hover:bg-amber-500 text-amber-600 hover:text-slate-950 dark:text-amber-400 dark:hover:text-slate-950 transition flex items-center gap-1 active:scale-95 cursor-pointer"
                                    title={`Set ${b.name} to show 1st on homepage`}
                                  >
                                    <ArrowUpToLine className="w-3 h-3" />
                                    <span>Set 1st</span>
                                  </button>
                                )}

                                {/* Up / Down Reorder Arrows */}
                                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                                  <button
                                    type="button"
                                    disabled={actualRankIdx <= 0}
                                    onClick={() => handleMoveBrand(b.id, "up")}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-20 cursor-pointer"
                                    title="Move brand up"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-800" />
                                  <button
                                    type="button"
                                    disabled={actualRankIdx >= activeBrands.length - 1}
                                    onClick={() => handleMoveBrand(b.id, "down")}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-20 cursor-pointer"
                                    title="Move brand down"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <button
                                  onClick={() =>
                                    setEditingBrandLogo({
                                      id: b.id,
                                      name: b.name,
                                      logo: b.logo || "",
                                    })
                                  }
                                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  title="Change Brand Logo"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleSoftDeleteBrand(b.id, b.name)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                  title="Move Brand to Recycle Bin"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setSelectedBrandForModels(b)}
                                  className={`p-2 rounded-xl transition ${
                                    isSelected ? "text-red-500" : "text-slate-400 hover:text-slate-600"
                                  }`}
                                  title="Manage Models"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                          <Car className="w-6 h-6 opacity-30 mx-auto" />
                          <p className="text-xs opacity-60 font-mono">
                            No active car brands match &ldquo;{brandSearch}&rdquo;
                          </p>
                          <button
                            onClick={() => setBrandSearch("")}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            Clear search filter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Models within Selected Brand */}
                  <div id="brand-models-view" className="lg:col-span-7 space-y-4 scroll-mt-28">
                    {(() => {
                      const curBrand =
                        (selectedBrandForModels && activeBrands.find((b) => b.id === selectedBrandForModels.id)) ||
                        filteredActiveBrands[0] ||
                        null;

                      if (!curBrand) {
                        return (
                          <div className="p-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                            <Car className="w-10 h-10 opacity-30 mx-auto" />
                            <p className="text-xs opacity-60 font-mono">
                              Select a brand on the left to view and manage its vehicle models and photos.
                            </p>
                          </div>
                        );
                      }

                      const rawActiveModels = (curBrand.subbrands || []).filter((m: any) => !m.isDeleted);
                      const q = brandSearch.trim().toLowerCase();
                      const displayedModels =
                        q && !curBrand.name.toLowerCase().includes(q)
                          ? rawActiveModels.filter(
                              (m: any) =>
                                m.name.toLowerCase().includes(q) ||
                                (Array.isArray(m.years) && m.years.some((y: string) => y.toLowerCase().includes(q)))
                            )
                          : rawActiveModels;

                      return (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-red-500 uppercase">
                                  Brand Focus
                                </span>
                                <span className="opacity-40">•</span>
                                <span className="text-xs font-mono opacity-60">
                                  {displayedModels.length} Active Models
                                </span>
                              </div>
                              <h3 className="text-lg font-black mt-0.5">
                                {curBrand.name} Models & Photos
                              </h3>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedBrandForModels(curBrand);
                                setNewModelForm({ name: "", imageUrl: "", years: COMMON_YEARS });
                                setShowAddModelModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition self-start sm:self-auto hover:opacity-90"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Model to {curBrand.name}</span>
                            </button>
                          </div>

                          {/* Grid of Models */}
                          {displayedModels.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {displayedModels.map((m: any) => {
                                const modelPhoto = m.imageUrl
                                  ? getDisplayImageUrl(m.imageUrl)
                                  : "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80";

                                const modelPartsCount = products.filter((p) => {
                                  if (p.isDeleted) return false;
                                  const matchBrand = p.brand.toLowerCase() === curBrand.name.toLowerCase();
                                  const matchModel =
                                    p.subbrand.toLowerCase() === m.name.toLowerCase() ||
                                    p.subbrand.toLowerCase() === "all models";
                                  return matchBrand && matchModel;
                                }).length;

                                return (
                                  <div
                                    key={m.name}
                                    className={`${cardClass} border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group`}
                                  >
                                    {/* Photo Header */}
                                    <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
                                      <img
                                        src={modelPhoto}
                                        alt={`${curBrand.name} ${m.name}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60" />

                                      <button
                                        onClick={() =>
                                          setEditingModelPhoto({
                                            brandId: curBrand.id,
                                            brandName: curBrand.name,
                                            modelName: m.name,
                                            photo: m.imageUrl || "",
                                          })
                                        }
                                        className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[10px] font-mono flex items-center gap-1.5 transition opacity-90 group-hover:opacity-100"
                                      >
                                        <Upload className="w-3 h-3" />
                                        <span>Change Photo</span>
                                      </button>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                                      <div>
                                        <div className="flex items-start justify-between gap-2">
                                          <h4 className="font-extrabold text-sm leading-tight">
                                            {m.name}
                                          </h4>
                                          <button
                                            onClick={() => handleSoftDeleteModel(curBrand.id, m.name)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                            title="Move Model to Recycle Bin"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        <p className="text-[11px] opacity-60 font-mono mt-0.5">
                                          {curBrand.name} {m.name} Fitments
                                        </p>
                                      </div>

                                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                                        <span className="font-bold text-amber-500">
                                          {modelPartsCount} Accessories
                                        </span>
                                        <span className="text-[10px] opacity-60">
                                          {m.years ? `${m.years.length} Years` : "All Years"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                              <Car className="w-8 h-8 opacity-40 mx-auto" />
                              <p className="text-xs opacity-60 font-mono">
                                No models registered under {curBrand.name} yet.
                              </p>
                              <button
                                onClick={() => {
                                  setSelectedBrandForModels(curBrand);
                                  setNewModelForm({ name: "", imageUrl: "", years: COMMON_YEARS });
                                  setShowAddModelModal(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs"
                              >
                                + Add First Model
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>
            )}

            {/* SUB-TAB 2: VEHICLE RECYCLE BIN */}
            {brandSubTab === "recycle_bin" && (
              <div className="space-y-8 animate-in fade-in duration-150">
                {/* Recycle Bin Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-500" />
                      <span>Vehicle Recycle Bin</span>
                    </h3>
                    <p className="text-xs opacity-60 font-mono mt-0.5">
                      Items here are hidden from the storefront. You can restore them to active status anytime or permanently delete them.
                    </p>
                  </div>

                  {totalVehicleRecycleCount > 0 && (
                    <button
                      onClick={handleEmptyBrandRecycleBin}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Empty Vehicle Recycle Bin</span>
                    </button>
                  )}
                </div>

                {/* Recycle Bin Content */}
                {totalVehicleRecycleCount === 0 ? (
                  <div className="p-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black">Vehicle Recycle Bin is Empty</h4>
                    <p className="text-xs opacity-60 font-mono max-w-md mx-auto">
                      No deleted car brands or vehicle models found in the recycle bin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* 1. Deleted Brands Section */}
                    {deletedBrands.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
                            <Car className="w-4 h-4 text-red-500" />
                            <span>Deleted Car Brands ({deletedBrands.length})</span>
                          </h4>
                          <span className="text-[11px] opacity-60 font-mono">
                            Restoring a brand also restores its models
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {deletedBrands.map((b) => {
                            const brandLogo = b.logo ? getDisplayImageUrl(b.logo) : null;
                            const modelsCount = b.subbrands?.length || 0;

                            return (
                              <div
                                key={b.id}
                                className={`${cardClass} border rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm border-amber-500/30 dark:border-amber-500/20`}
                              >
                                <div className="flex items-center gap-3.5">
                                  <div className="relative w-14 h-14 rounded-xl bg-white p-2 flex items-center justify-center shrink-0 shadow-sm border border-slate-200 overflow-hidden">
                                    {brandLogo ? (
                                      <img
                                        src={brandLogo}
                                        alt={b.name}
                                        className="max-w-full max-h-full object-contain grayscale opacity-60"
                                      />
                                    ) : (
                                      <span className="text-xs font-black text-slate-800 uppercase font-mono">
                                        {b.name.slice(0, 3)}
                                      </span>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-extrabold text-sm truncate line-through opacity-70">
                                        {b.name}
                                      </h5>
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        Deleted
                                      </span>
                                    </div>
                                    <p className="text-xs opacity-60 font-mono mt-0.5">
                                      {modelsCount} Models
                                    </p>
                                    {b.deletedAt && (
                                      <p className="text-[10px] opacity-40 font-mono mt-0.5">
                                        {new Date(b.deletedAt).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleRestoreBrand(b.id, b.name)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Restore Brand</span>
                                  </button>
                                  <button
                                    onClick={() => handlePermanentDeleteBrand(b.id, b.name)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Forever</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. Deleted Models Section */}
                    {deletedModelsList.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold uppercase tracking-wider opacity-80 flex items-center gap-2">
                            <Car className="w-4 h-4 text-amber-500" />
                            <span>Individually Deleted Vehicle Models ({deletedModelsList.length})</span>
                          </h4>
                          <span className="text-[11px] opacity-60 font-mono">
                            Models whose parent brand is active
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {deletedModelsList.map((m) => {
                            const photo = m.imageUrl
                              ? getDisplayImageUrl(m.imageUrl)
                              : "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80";

                            return (
                              <div
                                key={`${m.brandId}-${m.modelName}`}
                                className={`${cardClass} border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between border-amber-500/30 dark:border-amber-500/20`}
                              >
                                <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
                                  <img
                                    src={photo}
                                    alt={m.modelName}
                                    className="w-full h-full object-cover grayscale opacity-60"
                                  />
                                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-mono font-bold">
                                    {m.brandName}
                                  </span>
                                </div>

                                <div className="p-4 space-y-3">
                                  <div>
                                    <h5 className="font-extrabold text-sm line-through opacity-70">
                                      {m.modelName}
                                    </h5>
                                    <p className="text-[11px] opacity-60 font-mono mt-0.5">
                                      Parent Brand: {m.brandName}
                                    </p>
                                    {m.deletedAt && (
                                      <p className="text-[10px] opacity-40 font-mono mt-0.5">
                                        Deleted: {new Date(m.deletedAt).toLocaleString()}
                                      </p>
                                    )}
                                  </div>

                                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleRestoreModel(m.brandId, m.modelName)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Restore Model</span>
                                    </button>
                                    <button
                                      onClick={() => handlePermanentDeleteModel(m.brandId, m.modelName)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete Forever</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MODAL: ARRANGE BRAND DISPLAY ORDER */}
            {showArrangeBrandsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
                <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto`}>
                  {/* Modal Header */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <ArrowUpDown className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black flex items-center gap-2">
                          <span>Arrange Homepage Brand Display Order</span>
                        </h3>
                        <p className="text-xs opacity-60 mt-0.5">
                          Set the display sequence for car brands on the Homepage &apos;SELECT CAR BRAND&apos; grid (e.g. Set Mahindra to show 1st).
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowArrangeBrandsModal(false)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Live Sequence Preview Bar */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      Live Storefront Brand Sequence (Homepage Display)
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeBrands.map((b, idx) => (
                        <div
                          key={b.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                            idx === 0
                              ? "bg-amber-500 text-slate-950 shadow-sm"
                              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className={idx === 0 ? "font-black" : "opacity-50"}>#{idx + 1}</span>
                          <span>{b.name}</span>
                          {idx < activeBrands.length - 1 && <span className="opacity-30 ml-1">&rarr;</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brand Items Reorder List */}
                  <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
                    {activeBrands.map((b, idx) => {
                      const brandLogo = b.logo ? getDisplayImageUrl(b.logo) : null;
                      const isFirst = idx === 0;

                      return (
                        <div
                          key={b.id}
                          className={`pt-2.5 first:pt-0 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                            isFirst ? "bg-amber-500/5 border border-amber-500/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Position Badge */}
                            <div className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                              isFirst
                                ? "bg-amber-500 text-slate-950 shadow-sm"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}>
                              #{idx + 1}
                            </div>

                            {/* Logo */}
                            <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                              {brandLogo ? (
                                <img src={brandLogo} alt={b.name} className="max-w-full max-h-full object-contain" />
                              ) : (
                                <span className="text-[10px] font-black text-slate-800 font-mono">{b.name.slice(0, 3)}</span>
                              )}
                            </div>

                            {/* Name and details */}
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm truncate flex items-center gap-2">
                                <span>{b.name}</span>
                                {isFirst && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                    Shows 1st on Homepage
                                  </span>
                                )}
                              </h4>
                              <p className="text-[11px] opacity-60 font-mono">
                                {(b.subbrands || []).filter((s: any) => !s.isDeleted).length} Models
                              </p>
                            </div>
                          </div>

                          {/* Reordering Controls */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {/* Dropdown position selector */}
                            <select
                              value={idx + 1}
                              onChange={(e) => handleSetBrandPosition(b.id, parseInt(e.target.value, 10))}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold ${inputClass}`}
                              title="Set exact position"
                            >
                              {activeBrands.map((_, pIdx) => (
                                <option key={pIdx + 1} value={pIdx + 1}>
                                  Pos #{pIdx + 1} {pIdx === 0 ? "(1st)" : ""}
                                </option>
                              ))}
                            </select>

                            {/* Show 1st Quick Button */}
                            {!isFirst && (
                              <button
                                type="button"
                                onClick={() => handleSetBrandFirst(b.id, b.name)}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1 active:scale-95 shadow-xs cursor-pointer"
                                title={`Set ${b.name} as #1`}
                              >
                                <ArrowUpToLine className="w-3.5 h-3.5" />
                                <span>Make 1st</span>
                              </button>
                            )}

                            {/* Up / Down arrows */}
                            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveBrand(b.id, "up")}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-20 cursor-pointer"
                                title="Move up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800" />
                              <button
                                type="button"
                                disabled={idx === activeBrands.length - 1}
                                onClick={() => handleMoveBrand(b.id, "down")}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-20 cursor-pointer"
                                title="Move down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleResetBrandOrderAlphabetical}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Alphabetical (A-Z)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowArrangeBrandsModal(false)}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-md cursor-pointer"
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: ADD BRAND */}
            {showAddBrandModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
                <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Car className="w-4 h-4 text-red-500" />
                      <span>Add New Car Brand</span>
                    </h3>
                    <button onClick={() => setShowAddBrandModal(false)} className="p-1 opacity-60 hover:opacity-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateBrand(newBrandForm.name, newBrandForm.logo);
                    }}
                    className="space-y-4 text-xs font-mono"
                  >
                    <div className="space-y-1.5">
                      <label className="font-bold opacity-80">Brand / Make Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Porsche, Audi, Honda..."
                        value={newBrandForm.name}
                        onChange={(e) => setNewBrandForm({ ...newBrandForm, name: e.target.value })}
                        required
                        className={`w-full px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold opacity-80">Brand Logo Image</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Paste image URL or upload below..."
                          value={newBrandForm.logo}
                          onChange={(e) => setNewBrandForm({ ...newBrandForm, logo: e.target.value })}
                          className={`flex-1 px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                        />
                        <label className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition shrink-0 flex items-center gap-1.5 text-xs font-bold">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadingBrandLogo(true);
                                const url = await uploadFileToTelegram(file);
                                if (url) setNewBrandForm((prev) => ({ ...prev, logo: url }));
                                setUploadingBrandLogo(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {uploadingBrandLogo && (
                        <p className="text-[11px] text-amber-500 animate-pulse">Uploading to Telegram CDN...</p>
                      )}
                    </div>

                    {newBrandForm.logo && (
                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center border border-slate-200 shrink-0">
                          <img
                            src={getDisplayImageUrl(newBrandForm.logo)}
                            alt="Brand Logo Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <span className="text-[11px] opacity-70 truncate">{newBrandForm.logo}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddBrandModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md"
                      >
                        Create Brand
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL: ADD MODEL */}
            {showAddModelModal && selectedBrandForModels && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
                <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-red-500 font-bold uppercase">
                        {selectedBrandForModels.name}
                      </span>
                      <h3 className="font-bold text-base flex items-center gap-2 mt-0.5">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        <span>Add New Vehicle Model</span>
                      </h3>
                    </div>
                    <button onClick={() => setShowAddModelModal(false)} className="p-1 opacity-60 hover:opacity-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateModel(
                        selectedBrandForModels.id,
                        newModelForm.name,
                        newModelForm.imageUrl,
                        newModelForm.years
                      );
                    }}
                    className="space-y-4 text-xs font-mono"
                  >
                    <div className="space-y-1.5">
                      <label className="font-bold opacity-80">Model Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. 3-Series / Gran Limousine, X5, Thar Roxx..."
                        value={newModelForm.name}
                        onChange={(e) => setNewModelForm({ ...newModelForm, name: e.target.value })}
                        required
                        className={`w-full px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold opacity-80">Vehicle Model Photo (Car Card Image)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Paste image URL or upload photo..."
                          value={newModelForm.imageUrl}
                          onChange={(e) => setNewModelForm({ ...newModelForm, imageUrl: e.target.value })}
                          className={`flex-1 px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                        />
                        <label className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition shrink-0 flex items-center gap-1.5 text-xs font-bold">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadingModelPhoto(true);
                                const url = await uploadFileToTelegram(file);
                                if (url) setNewModelForm((prev) => ({ ...prev, imageUrl: url }));
                                setUploadingModelPhoto(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {uploadingModelPhoto && (
                        <p className="text-[11px] text-amber-500 animate-pulse">Uploading photo to Telegram CDN...</p>
                      )}
                    </div>

                    {newModelForm.imageUrl && (
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
                        <img
                          src={getDisplayImageUrl(newModelForm.imageUrl)}
                          alt="Model Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModelModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md"
                      >
                        Add Model
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL: EDIT BRAND LOGO */}
            {editingBrandLogo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
                <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-red-500" />
                      <span>Update Logo for {editingBrandLogo.name}</span>
                    </h3>
                    <button onClick={() => setEditingBrandLogo(null)} className="p-1 opacity-60 hover:opacity-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <label className="font-bold opacity-80">Brand Logo URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingBrandLogo.logo}
                          onChange={(e) => setEditingBrandLogo({ ...editingBrandLogo, logo: e.target.value })}
                          className={`flex-1 px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                          placeholder="Paste logo URL or upload below..."
                        />
                        <label className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition shrink-0 flex items-center gap-1.5 text-xs font-bold">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadingBrandLogo(true);
                                const url = await uploadFileToTelegram(file);
                                if (url) setEditingBrandLogo((prev) => prev ? { ...prev, logo: url } : null);
                                setUploadingBrandLogo(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {uploadingBrandLogo && (
                        <p className="text-[11px] text-amber-500 animate-pulse">Uploading to Telegram CDN...</p>
                      )}
                    </div>

                    {editingBrandLogo.logo && (
                      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-white p-3 flex items-center justify-center border border-slate-200 shadow-md overflow-hidden">
                          <img
                            src={getDisplayImageUrl(editingBrandLogo.logo)}
                            alt="Logo Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingBrandLogo(null)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveBrandLogo(editingBrandLogo.id, editingBrandLogo.logo)}
                        className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md"
                      >
                        Save Logo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: EDIT MODEL PHOTO */}
            {editingModelPhoto && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
                <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-red-500 font-bold uppercase">
                        {editingModelPhoto.brandName}
                      </span>
                      <h3 className="font-bold text-base flex items-center gap-2 mt-0.5">
                        <ImageIcon className="w-4 h-4 text-emerald-500" />
                        <span>Update Photo for {editingModelPhoto.modelName}</span>
                      </h3>
                    </div>
                    <button onClick={() => setEditingModelPhoto(null)} className="p-1 opacity-60 hover:opacity-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <label className="font-bold opacity-80">Car Photo URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingModelPhoto.photo}
                          onChange={(e) => setEditingModelPhoto({ ...editingModelPhoto, photo: e.target.value })}
                          className={`flex-1 px-3.5 py-2.5 rounded-xl border ${inputClass}`}
                          placeholder="Paste image URL or upload photo below..."
                        />
                        <label className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition shrink-0 flex items-center gap-1.5 text-xs font-bold">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadingModelPhoto(true);
                                const url = await uploadFileToTelegram(file);
                                if (url) setEditingModelPhoto((prev) => prev ? { ...prev, photo: url } : null);
                                setUploadingModelPhoto(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {uploadingModelPhoto && (
                        <p className="text-[11px] text-amber-500 animate-pulse">Uploading photo to Telegram CDN...</p>
                      )}
                    </div>

                    {editingModelPhoto.photo && (
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
                        <img
                          src={getDisplayImageUrl(editingModelPhoto.photo)}
                          alt="Photo Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingModelPhoto(null)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveModelPhoto(
                            editingModelPhoto.brandId,
                            editingModelPhoto.modelName,
                            editingModelPhoto.photo
                          )
                        }
                        className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md"
                      >
                        Save Photo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: PLP SETTINGS (Admin Only)                                  */}
        {/* ================================================================= */}
        {activeTab === "plp_settings" && authRole === "admin" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Product Listing Page (PLP) Controls</h2>
              <p className="text-xs opacity-60 mt-0.5">
                Developer-grade On/Off switches. Turn storefront features on or off in real time without writing any code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-red-500" />
                    <span>Quick Preview Eye Button</span>
                  </h4>
                  <p className="text-xs opacity-60">Shows an eye preview icon on each product card for fast modal peek.</p>
                </div>
                <button
                  onClick={() => updateSetting("plp_showQuickPreview", !settings.plp_showQuickPreview)}
                  className={`p-1.5 rounded-full transition ${settings.plp_showQuickPreview ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.plp_showQuickPreview ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>OEM Coupler Fitment Tag</span>
                  </h4>
                  <p className="text-xs opacity-60">Displays &ldquo;OEM Coupler-to-Coupler Fitment&rdquo; badge on card bottoms.</p>
                </div>
                <button
                  onClick={() => updateSetting("plp_showCouplerBadge", !settings.plp_showCouplerBadge)}
                  className={`p-1.5 rounded-full transition ${settings.plp_showCouplerBadge ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.plp_showCouplerBadge ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span>Media Count Floating Pill</span>
                  </h4>
                  <p className="text-xs opacity-60">Displays photo count pill on product thumbnails.</p>
                </div>
                <button
                  onClick={() => updateSetting("plp_showMediaCountPill", !settings.plp_showMediaCountPill)}
                  className={`p-1.5 rounded-full transition ${settings.plp_showMediaCountPill ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.plp_showMediaCountPill ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-500" />
                    <span>PLP Video Tag (&ldquo;• 1 Video&rdquo;)</span>
                  </h4>
                  <p className="text-xs opacity-60">Shows or hides the &ldquo;• 1 Video&rdquo; indicator on product thumbnails in the listing page.</p>
                </div>
                <button
                  onClick={() => updateSetting("plp_showVideo", settings.plp_showVideo === false ? true : false)}
                  className={`p-1.5 rounded-full transition ${settings.plp_showVideo !== false ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.plp_showVideo !== false ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-blue-500" />
                    <span>Category Filter Tabs</span>
                  </h4>
                  <p className="text-xs opacity-60">Shows category pill buttons (Infotainment, Lighting, Interior...) above grid.</p>
                </div>
                <button
                  onClick={() => updateSetting("plp_showCategoryTabs", !settings.plp_showCategoryTabs)}
                  className={`p-1.5 rounded-full transition ${settings.plp_showCategoryTabs ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.plp_showCategoryTabs ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Car className="w-4 h-4 text-red-500" />
                    <span>Vehicle Cascade Configurator Dock</span>
                  </h4>
                  <p className="text-xs opacity-60">Displays Make → Model → Year cascading dock below hero.</p>
                </div>
                <button
                  onClick={() => updateSetting("plp_showVehicleCascade", !settings.plp_showVehicleCascade)}
                  className={`p-1.5 rounded-full transition ${settings.plp_showVehicleCascade ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.plp_showVehicleCascade ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Product Badges (&ldquo;Best Seller&rdquo;)</span>
                  </h4>
                  <p className="text-xs opacity-60">Shows custom red badge pills on product thumbnails.</p>
                </div>
                <button
                  onClick={() => updateSetting("plp_showBadges", !settings.plp_showBadges)}
                  className={`p-1.5 rounded-full transition ${settings.plp_showBadges ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.plp_showBadges ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              {/* PLP Multi-Image Hover Slideshow & Timer */}
              <div className={`${cardClass} border rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>PLP Hover Image Slideshow</span>
                  </h4>
                  <p className="text-xs opacity-60">
                    Cycles through all accessory gallery photos automatically when hovering over any card.
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-mono opacity-70">Timer:</span>
                    <input
                      type="number"
                      min={0.5}
                      max={20}
                      step={0.5}
                      value={settings.plp_slideshowInterval ?? 1.5}
                      onChange={(e) => updateSetting("plp_slideshowInterval", parseFloat(e.target.value) || 1.5)}
                      className={`w-16 px-2 py-1 rounded-xl border text-xs font-mono text-center font-bold ${inputClass}`}
                    />
                    <span className="text-[11px] font-mono opacity-70">sec</span>
                  </div>
                  <button
                    onClick={() => updateSetting("plp_enableHoverSlideshow", settings.plp_enableHoverSlideshow === false ? true : false)}
                    className={`p-1.5 rounded-full transition ${settings.plp_enableHoverSlideshow !== false ? "text-emerald-500" : "text-slate-400"}`}
                    title="Toggle PLP hover slideshow"
                  >
                    {settings.plp_enableHoverSlideshow !== false ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                  </button>
                </div>
              </div>

              {/* PLP Share Product Button */}
              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-red-500" />
                    <span>PLP Product Share Icon</span>
                  </h4>
                  <p className="text-xs opacity-60">Shows or hides the direct Share Modal button on each card in catalog listing.</p>
                </div>
                <button
                  onClick={() => updateSetting("plp_showShareButton", settings.plp_showShareButton === false ? true : false)}
                  className={`p-1.5 rounded-full transition ${settings.plp_showShareButton !== false ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.plp_showShareButton !== false ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: PDP SETTINGS (Admin Only)                                  */}
        {/* ================================================================= */}
        {activeTab === "pdp_settings" && authRole === "admin" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Product Detail Page (PDP) Controls</h2>
              <p className="text-xs opacity-60 mt-0.5">
                Full developer control over every single module and section of the dedicated product detail page.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-500" />
                    <span>Engineering CAD Schematic Box</span>
                  </h4>
                  <p className="text-xs opacity-60">Displays millimeter-accurate coupler CAD diagram preview below gallery.</p>
                </div>
                <button
                  onClick={() => updateSetting("pdp_showCadSchematic", !settings.pdp_showCadSchematic)}
                  className={`p-1.5 rounded-full transition ${settings.pdp_showCadSchematic ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.pdp_showCadSchematic ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-red-500" />
                    <span>Demo Video Player Slot</span>
                  </h4>
                  <p className="text-xs opacity-60">Shows interactive video playback slot as the final slide of gallery.</p>
                </div>
                <button
                  onClick={() => updateSetting("pdp_showVideoPlayer", !settings.pdp_showVideoPlayer)}
                  className={`p-1.5 rounded-full transition ${settings.pdp_showVideoPlayer ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.pdp_showVideoPlayer ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>WhatsApp Direct Enquiry Button</span>
                  </h4>
                  <p className="text-xs opacity-60">Allows customers to immediately chat with Cars9 Studio on WhatsApp about this part.</p>
                </div>
                <button
                  onClick={() => updateSetting("pdp_showWhatsAppEnquiry", !settings.pdp_showWhatsAppEnquiry)}
                  className={`p-1.5 rounded-full transition ${settings.pdp_showWhatsAppEnquiry ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.pdp_showWhatsAppEnquiry ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-purple-500" />
                    <span>1-Click Copy Share Link</span>
                  </h4>
                  <p className="text-xs opacity-60">Floating share button in the top right corner of product gallery.</p>
                </div>
                <button
                  onClick={() => updateSetting("pdp_showDirectShareLink", !settings.pdp_showDirectShareLink)}
                  className={`p-1.5 rounded-full transition ${settings.pdp_showDirectShareLink ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.pdp_showDirectShareLink ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <span>Quantity Counter Controls</span>
                  </h4>
                  <p className="text-xs opacity-60">Enables customer to choose + / - item quantity before adding to quote.</p>
                </div>
                <button
                  onClick={() => updateSetting("pdp_showQuantitySelector", !settings.pdp_showQuantitySelector)}
                  className={`p-1.5 rounded-full transition ${settings.pdp_showQuantitySelector ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.pdp_showQuantitySelector ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              <div className={`${cardClass} border rounded-3xl p-5 flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Vehicle Compatibility Banner</span>
                  </h4>
                  <p className="text-xs opacity-60">Shows green &ldquo;100% Plug-and-Play Coupler Fitment • Zero Wire Slicing&rdquo; box.</p>
                </div>
                <button
                  onClick={() => updateSetting("pdp_showCompatibilityBanner", !settings.pdp_showCompatibilityBanner)}
                  className={`p-1.5 rounded-full transition ${settings.pdp_showCompatibilityBanner ? "text-emerald-500" : "text-slate-400"}`}
                >
                  {settings.pdp_showCompatibilityBanner ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              {/* PDP Auto-Play Gallery Slideshow & Timer Box */}
              <div className={`${cardClass} border rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:col-span-2`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>PDP Auto-Play Gallery Slideshow</span>
                  </h4>
                  <p className="text-xs opacity-60">
                    Automatically plays through accessory photos in sequence. Tap/click on any photo instantly stops the slideshow.
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-mono opacity-70">Duration:</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      step={1}
                      value={settings.pdp_slideshowInterval ?? 2}
                      onChange={(e) => updateSetting("pdp_slideshowInterval", parseFloat(e.target.value) || 2)}
                      className={`w-16 px-2 py-1 rounded-xl border text-xs font-mono text-center font-bold ${inputClass}`}
                    />
                    <span className="text-[11px] font-mono opacity-70">sec</span>
                  </div>
                  <button
                    onClick={() => updateSetting("pdp_enableSlideshow", settings.pdp_enableSlideshow === false ? true : false)}
                    className={`p-1.5 rounded-full transition ${settings.pdp_enableSlideshow !== false ? "text-emerald-500" : "text-slate-400"}`}
                    title="Toggle PDP auto slideshow"
                  >
                    {settings.pdp_enableSlideshow !== false ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 8: BRANDING & FOOTER CONTROLS (Admin Only)                    */}
        {/* ================================================================= */}
        {activeTab === "branding_footer" && authRole === "admin" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-red-500" />
                  <span>Site Branding & Footer Information Control</span>
                </h2>
                <p className="text-xs opacity-60 mt-0.5">
                  Update the official site logo across header and footer, customize company details, and configure WhatsApp routing numbers.
                </p>
              </div>

              {/* Dedicated WhatsApp Button with Status Pill */}
              <button
                type="button"
                onClick={() => setIsWhatsAppDropdownOpen(!isWhatsAppDropdownOpen)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition active:scale-95 flex items-center gap-2.5 shrink-0 cursor-pointer ${
                  isWhatsAppDropdownOpen
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-slate-900/20"
                    : "bg-[#25D366] hover:bg-[#20ba59] text-white shadow-[#25D366]/25"
                }`}
                title="Open WhatsApp number routing configuration"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 2C6.495 2 2 6.494 2 12.03c0 1.97.57 3.81 1.554 5.37L2 22l4.77-1.523A9.975 9.975 0 0 0 12.031 22c5.535 0 10.03-4.494 10.03-10.03C22.062 6.494 17.566 2 12.031 2zm5.82 14.28c-.24.67-1.39 1.28-1.92 1.34-.49.06-1.12.08-3.6-1.02-2.98-1.32-4.88-4.37-5.03-4.57-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.16 1.02-2.45.27-.29.59-.36.79-.36.2 0 .4 0 .58.01.19.01.44-.07.69.52.26.61.88 2.14.96 2.3.08.15.13.34.02.54-.1.2-.16.32-.31.5-.15.18-.32.4-.46.54-.15.15-.31.32-.13.63.18.31.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.46 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.84.87 2.15 1.03.31.15.52.23.6.36.08.14.08.79-.16 1.46z" />
                  </svg>
                </div>
                <span>Configure WhatsApp Routing</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isWhatsAppDropdownOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Dedicated WhatsApp Routing Dropdown Screen */}
            {isWhatsAppDropdownOpen && (
              <div className={`${cardClass} border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl shadow-emerald-500/10 animate-in fade-in slide-in-from-top-3 duration-200`}>
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12.031 2C6.495 2 2 6.494 2 12.03c0 1.97.57 3.81 1.554 5.37L2 22l4.77-1.523A9.975 9.975 0 0 0 12.031 22c5.535 0 10.03-4.494 10.03-10.03C22.062 6.494 17.566 2 12.031 2zm5.82 14.28c-.24.67-1.39 1.28-1.92 1.34-.49.06-1.12.08-3.6-1.02-2.98-1.32-4.88-4.37-5.03-4.57-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.16 1.02-2.45.27-.29.59-.36.79-.36.2 0 .4 0 .58.01.19.01.44-.07.69.52.26.61.88 2.14.96 2.3.08.15.13.34.02.54-.1.2-.16.32-.31.5-.15.18-.32.4-.46.54-.15.15-.31.32-.13.63.18.31.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.46 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.84.87 2.15 1.03.31.15.52.23.6.36.08.14.08.79-.16 1.46z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold flex items-center gap-2">
                        <span>WhatsApp Direct Numbers & Channel Routing</span>
                      </h3>
                      <p className="text-xs opacity-60 mt-0.5">
                        Configure dedicated WhatsApp numbers for individual touchpoints or apply one master number to all.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWhatsAppDropdownOpen(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                    title="Close WhatsApp panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Notifications / Feedback */}
                {whatsappAppliedMsg && (
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{whatsappAppliedMsg}</span>
                  </div>
                )}
                {whatsappSavedMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{whatsappSavedMsg}</span>
                  </div>
                )}

                {/* Master Number Section with "Apply to All" */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider font-mono text-emerald-700 dark:text-emerald-400">
                        Master Studio WhatsApp Number
                      </label>
                      <p className="text-[11px] opacity-70 mt-0.5">
                        Acts as the primary fallback for any touchpoint left blank.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyMasterToAll}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                      title="Set this master number for Homepage Card, Footer, PDP and Quotation"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply to All (Set All to This Number)</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={whatsappMasterInput}
                      onChange={(e) => setWhatsappMasterInput(e.target.value)}
                      placeholder="+91 90000 00000 / 919000000000"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono ${inputClass}`}
                    />
                  </div>
                </div>

                {/* Individual Channel Settings Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                      Individual Channel Routing Numbers
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Leave individual blank to use Master Number)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Homepage Card */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold flex items-center gap-1.5">
                          <span>1. Homepage Studio Card</span>
                        </label>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Homepage &apos;WhatsApp Studio&apos;
                        </span>
                      </div>
                      <p className="text-[11px] opacity-60">
                        Chat link on the quick consultation card below the hero banner.
                      </p>
                      <input
                        type="text"
                        value={whatsappCardInput}
                        onChange={(e) => setWhatsappCardInput(e.target.value)}
                        placeholder={`e.g. +91 98888 88888 (Fallback: ${whatsappMasterInput || "Master"})`}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputClass}`}
                      />
                    </div>

                    {/* 2. Storefront Footer Icon */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold flex items-center gap-1.5">
                          <span>2. Footer Social Icon</span>
                        </label>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Footer WhatsApp Icon
                        </span>
                      </div>
                      <p className="text-[11px] opacity-60">
                        Direct link when visitors tap the colorful WhatsApp icon in the footer.
                      </p>
                      <input
                        type="text"
                        value={whatsappFooterInput}
                        onChange={(e) => setWhatsappFooterInput(e.target.value)}
                        placeholder={`e.g. +91 98888 88888 (Fallback: ${whatsappMasterInput || "Master"})`}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputClass}`}
                      />
                    </div>

                    {/* 3. PDP Enquire Button */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold flex items-center gap-1.5">
                          <span>3. PDP Enquire Button</span>
                        </label>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                          Product Page Enquiry
                        </span>
                      </div>
                      <p className="text-[11px] opacity-60">
                        Receives product name, SKU, vehicle fitment & quotation request.
                      </p>
                      <input
                        type="text"
                        value={whatsappPdpInput}
                        onChange={(e) => setWhatsappPdpInput(e.target.value)}
                        placeholder={`e.g. +91 97777 77777 (Fallback: ${whatsappMasterInput || "Master"})`}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputClass}`}
                      />
                    </div>

                    {/* 4. Quotation Review Page */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold flex items-center gap-1.5">
                          <span>4. Quotation Review Page</span>
                        </label>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Quotation Submit & Review
                        </span>
                      </div>
                      <p className="text-[11px] opacity-60">
                        Receives submitted customer quotation enquiries and cart summary.
                      </p>
                      <input
                        type="text"
                        value={whatsappQuotationInput}
                        onChange={(e) => setWhatsappQuotationInput(e.target.value)}
                        placeholder={`e.g. +91 96666 66666 (Fallback: ${whatsappMasterInput || "Master"})`}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputClass}`}
                      />
                    </div>

                    {/* 5. Enquiries / Staff Quotation Dispatch */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold flex items-center gap-1.5">
                          <span>5. Enquiries / Staff Dispatch</span>
                        </label>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Admin Enquiries Dispatch
                        </span>
                      </div>
                      <p className="text-[11px] opacity-60">
                        Target recipient when staff clicks &ldquo;Dispatch on WhatsApp&rdquo; in Quotation Pricing Desk.
                      </p>
                      <input
                        type="text"
                        value={whatsappDispatchInput}
                        onChange={(e) => setWhatsappDispatchInput(e.target.value)}
                        placeholder={`e.g. +91 95555 55555 (Fallback: Customer Phone / Master)`}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputClass}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] opacity-60 font-mono text-center sm:text-left">
                    Direct phone numbers support formatting with country codes (e.g. +91 90000 00000).
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsWhatsAppDropdownOpen(false)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      disabled={savingWhatsApp}
                      onClick={handleSaveWhatsAppNumbers}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingWhatsApp ? "Saving..." : "Save WhatsApp Numbers"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 1. Official Site Logo Management */}
            <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 space-y-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Site Logo (Header & Footer Dynamic Brand Mark)</span>
                  </h3>
                  <p className="text-xs opacity-60 mt-0.5">
                    Upload a high-resolution logo image or configure an external URL. Active immediately across all pages.
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 self-start sm:self-auto">
                  {settings.site_logo_url && settings.site_logo_url !== "/images/cars9-logo.png" ? "Custom Logo Active" : "Default Logo Active"}
                </span>
              </div>

              {/* Live Preview Boxes: Light & Dark Modes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2 shadow-xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                    Header Light Preview
                  </span>
                  <div className="h-16 flex items-center justify-center">
                    <Cars9Logo size="md" href="/" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2 shadow-xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                    Header Dark Preview
                  </span>
                  <div className="h-16 flex items-center justify-center">
                    <Cars9Logo size="md" href="/" />
                  </div>
                </div>
              </div>

              {/* Upload & Edit Controls */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono mb-2">
                    Upload New Logo Image (File)
                  </label>
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={handleSiteLogoUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={uploadingSiteLogo}
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <Upload className={`w-4 h-4 ${uploadingSiteLogo ? "animate-spin" : ""}`} />
                      <span>{uploadingSiteLogo ? "Uploading via Telegram CDN..." : "Upload Logo Image..."}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetSiteLogo}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                      title="Reset back to official Cars9 studio logo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Default Logo</span>
                    </button>
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                    Or Direct Image / CDN URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. /images/cars9-logo.png or https://..."
                      value={customLogoUrlInput}
                      onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                      className={`flex-1 px-4 py-2 rounded-xl border text-xs font-mono ${inputClass}`}
                    />
                    <button
                      type="button"
                      onClick={handleSetCustomLogoUrl}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                    >
                      Apply URL
                    </button>
                  </div>
                </div>

                {/* Permanent Guarantee Notice */}
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-center gap-2 font-mono">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Permanent Visibility Guarantee:</strong> The logo cannot be deleted. If a custom upload is removed or fails, it automatically falls back to the official Cars9 logo so header and footer are always branded.
                  </span>
                </div>
              </div>
            </div>

            {/* Homepage Action & Feature Cards Control (Top 4 Cards) */}
            <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 space-y-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-red-500" />
                    <span>Homepage Action & Feature Cards (Top 4 Strip Cards)</span>
                  </h3>
                  <p className="text-xs opacity-60 mt-0.5">
                    Rename titles, update subtitles, and configure custom button/link URLs for each of the 4 quick action cards on the storefront.
                  </p>
                </div>
                {homeCardsSavedMsg && (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{homeCardsSavedMsg}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveHomeCards} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Card 1: Zero Wire Slicing / Badge */}
                  <div className={`p-4 sm:p-5 rounded-2xl border ${innerCardClass} space-y-3`}>
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs">Card 1 (Left Feature Badge)</span>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Card Title</label>
                      <input
                        type="text"
                        value={homeCard1Title}
                        onChange={(e) => setHomeCard1Title(e.target.value)}
                        placeholder="e.g. Zero Wire Slicing"
                        className={`w-full px-3 py-2 rounded-xl border text-xs ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Subtitle</label>
                      <input
                        type="text"
                        value={homeCard1Sub}
                        onChange={(e) => setHomeCard1Sub(e.target.value)}
                        placeholder="e.g. 100% OEM Couplers"
                        className={`w-full px-3 py-2 rounded-xl border text-xs ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Custom Button/Link URL (Optional)</label>
                      <input
                        type="text"
                        value={homeCard1Url}
                        onChange={(e) => setHomeCard1Url(e.target.value)}
                        placeholder="e.g. /about or https://... (Leave empty for badge)"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputClass}`}
                      />
                    </div>
                  </div>

                  {/* Card 2: Digital Warranty */}
                  <div className={`p-4 sm:p-5 rounded-2xl border ${innerCardClass} space-y-3`}>
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs">Card 2 (Digital Warranty Card)</span>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Card Title</label>
                      <input
                        type="text"
                        value={homeCard2Title}
                        onChange={(e) => setHomeCard2Title(e.target.value)}
                        placeholder="e.g. Warranty Protected"
                        className={`w-full px-3 py-2 rounded-xl border text-xs ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Subtitle</label>
                      <input
                        type="text"
                        value={homeCard2Sub}
                        onChange={(e) => setHomeCard2Sub(e.target.value)}
                        placeholder="e.g. Verify Certificate →"
                        className={`w-full px-3 py-2 rounded-xl border text-xs ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Custom Button/Link URL</label>
                      <input
                        type="text"
                        value={homeCard2Url}
                        onChange={(e) => setHomeCard2Url(e.target.value)}
                        placeholder="Default: /warranty"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputClass}`}
                      />
                    </div>
                  </div>

                  {/* Card 3: WhatsApp Chat Card */}
                  <div className={`p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3`}>
                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/20">
                      <div className="w-7 h-7 rounded-lg bg-[#25D366]/20 text-[#25D366] flex items-center justify-center">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12.031 2C6.495 2 2 6.494 2 12.03c0 1.97.57 3.81 1.554 5.37L2 22l4.77-1.523A9.975 9.975 0 0 0 12.031 22c5.535 0 10.03-4.494 10.03-10.03C22.062 6.494 17.566 2 12.031 2zm5.82 14.28c-.24.67-1.39 1.28-1.92 1.34-.49.06-1.12.08-3.6-1.02-2.98-1.32-4.88-4.37-5.03-4.57-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.16 1.02-2.45.27-.29.59-.36.79-.36.2 0 .4 0 .58.01.19.01.44-.07.69.52.26.61.88 2.14.96 2.3.08.15.13.34.02.54-.1.2-.16.32-.31.5-.15.18-.32.4-.46.54-.15.15-.31.32-.13.63.18.31.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.46 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.84.87 2.15 1.03.31.15.52.23.6.36.08.14.08.79-.16 1.46z" />
                        </svg>
                      </div>
                      <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">Card 3 (WhatsApp Direct Chat Card)</span>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Card Title (Easy Name)</label>
                      <input
                        type="text"
                        value={homeCard3Title}
                        onChange={(e) => setHomeCard3Title(e.target.value)}
                        placeholder="e.g. WhatsApp Chat or Chat with Us"
                        className={`w-full px-3 py-2 rounded-xl border text-xs ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Subtitle</label>
                      <input
                        type="text"
                        value={homeCard3Sub}
                        onChange={(e) => setHomeCard3Sub(e.target.value)}
                        placeholder="e.g. Direct Chat →"
                        className={`w-full px-3 py-2 rounded-xl border text-xs ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Custom Button/Link URL (Optional)</label>
                      <input
                        type="text"
                        value={homeCard3Url}
                        onChange={(e) => setHomeCard3Url(e.target.value)}
                        placeholder="Leave blank to use WhatsApp Studio number routing"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputClass}`}
                      />
                      <span className="text-[10px] opacity-60 font-mono block">If left blank, automatically routes to WhatsApp via wa.me link.</span>
                    </div>
                  </div>

                  {/* Card 4: Store Locator / Maps */}
                  <div className={`p-4 sm:p-5 rounded-2xl border ${innerCardClass} space-y-3`}>
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs">Card 4 (Store Locator / Google Maps Card)</span>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Card Title</label>
                      <input
                        type="text"
                        value={homeCard4Title}
                        onChange={(e) => setHomeCard4Title(e.target.value)}
                        placeholder="e.g. Store Locator"
                        className={`w-full px-3 py-2 rounded-xl border text-xs ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Subtitle</label>
                      <input
                        type="text"
                        value={homeCard4Sub}
                        onChange={(e) => setHomeCard4Sub(e.target.value)}
                        placeholder="e.g. Google Maps →"
                        className={`w-full px-3 py-2 rounded-xl border text-xs ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono opacity-70">Custom Button/Link URL (Optional)</label>
                      <input
                        type="text"
                        value={homeCard4Url}
                        onChange={(e) => setHomeCard4Url(e.target.value)}
                        placeholder="Leave blank to use footer Google Maps link"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${inputClass}`}
                      />
                    </div>
                  </div>

                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingHomeCards}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingHomeCards ? "Saving..." : "Save Homepage Cards"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Footer Studio Information Controls */}
            <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 space-y-6`}>
              <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Storefront Footer Details</span>
                </h3>
                <p className="text-xs opacity-60 mt-0.5">
                  Complete control over company description, guarantee badges, studio timings, contact numbers, and physical address.
                </p>
              </div>

              {footerSavedMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{footerSavedMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveFooterInfo} className="space-y-5">
                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                    Studio Brand Description
                  </label>
                  <textarea
                    rows={3}
                    value={footerForm.description}
                    onChange={(e) => setFooterForm({ ...footerForm, description: e.target.value })}
                    placeholder="Enter studio description..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs leading-relaxed ${inputClass}`}
                    required
                  />
                  <span className="text-[10px] opacity-60 font-mono">Displayed in Column 1 below the Cars9 logo.</span>
                </div>

                {/* Guarantee Text */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                    Quality Guarantee Badge Text
                  </label>
                  <input
                    type="text"
                    value={footerForm.guaranteeText}
                    onChange={(e) => setFooterForm({ ...footerForm, guaranteeText: e.target.value })}
                    placeholder="e.g. 100% Zero Wire Slicing Guarantee"
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs ${inputClass}`}
                    required
                  />
                </div>

                {/* Contact Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                      Studio Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={footerForm.phone}
                      onChange={(e) => setFooterForm({ ...footerForm, phone: e.target.value })}
                      placeholder="+91 90000 00000 / +91 98888 88888"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs ${inputClass}`}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                      Concierge Support Email
                    </label>
                    <input
                      type="email"
                      value={footerForm.email}
                      onChange={(e) => setFooterForm({ ...footerForm, email: e.target.value })}
                      placeholder="concierge@cars9studio.com"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs ${inputClass}`}
                      required
                    />
                  </div>
                </div>

                {/* Physical Bay Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                    Studio Bay Physical Address
                  </label>
                  <textarea
                    rows={2}
                    value={footerForm.address}
                    onChange={(e) => setFooterForm({ ...footerForm, address: e.target.value })}
                    placeholder="Enter physical studio location..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs ${inputClass}`}
                    required
                  />
                </div>

                {/* Google Maps URL */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Google Maps Link (Store Locator Card & Footer)</span>
                  </label>
                  <input
                    type="text"
                    value={footerForm.mapsUrl}
                    onChange={(e) => setFooterForm({ ...footerForm, mapsUrl: e.target.value })}
                    placeholder="https://maps.google.com/?q=... or https://maps.app.goo.gl/..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono normal-case ${inputClass}`}
                  />
                  <span className="text-[10px] opacity-60 font-mono">
                    Powers the homepage &ldquo;Store Locator&rdquo; card and the footer &ldquo;View on Google Maps&rdquo; link.
                  </span>
                </div>

                {/* Working Hours & Timings */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                    Studio Operations & Working Hours (One line per bullet)
                  </label>
                  <textarea
                    rows={4}
                    value={footerForm.timings}
                    onChange={(e) => setFooterForm({ ...footerForm, timings: e.target.value })}
                    placeholder="Monday – Saturday: 10:00 AM – 8:30 PM&#10;Sunday: By Prior Appointment Only&#10;..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono leading-relaxed ${inputClass}`}
                    required
                  />
                  <span className="text-[10px] opacity-60 font-mono">Each new line renders as a bullet item in the &ldquo;Studio Operations&rdquo; column.</span>
                </div>

                {/* Copyright Line */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                    Copyright Notice
                  </label>
                  <input
                    type="text"
                    value={footerForm.copyright}
                    onChange={(e) => setFooterForm({ ...footerForm, copyright: e.target.value })}
                    placeholder="© {year} CARS9 Automotive Studio. All rights reserved."
                    className={`w-full px-4 py-2.5 rounded-xl border text-xs ${inputClass}`}
                    required
                  />
                  <span className="text-[10px] opacity-60 font-mono">Use &ldquo;{'{year}'}&rdquo; to dynamically insert the current year.</span>
                </div>

                {/* Footer Quick Links Visibility */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                    Footer Quick Links Visibility
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${innerCardClass}`}>
                      <span className="text-xs font-bold">Digital Warranty</span>
                      <input
                        type="checkbox"
                        checked={footerForm.showWarranty}
                        onChange={(e) => setFooterForm({ ...footerForm, showWarranty: e.target.checked })}
                        className="w-4 h-4 accent-red-600 rounded"
                      />
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${innerCardClass}`}>
                      <span className="text-xs font-bold">Owner Pricing Tool</span>
                      <input
                        type="checkbox"
                        checked={footerForm.showPricing}
                        onChange={(e) => setFooterForm({ ...footerForm, showPricing: e.target.checked })}
                        className="w-4 h-4 accent-red-600 rounded"
                      />
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${innerCardClass}`}>
                      <span className="text-xs font-bold">Admin Portal Link</span>
                      <input
                        type="checkbox"
                        checked={footerForm.showAdmin}
                        onChange={(e) => setFooterForm({ ...footerForm, showAdmin: e.target.checked })}
                        className="w-4 h-4 accent-red-600 rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Social Media Channels & Direct Profiles */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider font-mono opacity-80">
                      Studio Social Media Profiles & Direct Links
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Displayed as brand icons in footer</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold opacity-70 mb-1">
                        Instagram Profile URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.socialInstagram}
                        onChange={(e) => setFooterForm({ ...footerForm, socialInstagram: e.target.value })}
                        placeholder="https://instagram.com/yourhandle"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono normal-case ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold opacity-70 mb-1">
                        Facebook Page URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.socialFacebook}
                        onChange={(e) => setFooterForm({ ...footerForm, socialFacebook: e.target.value })}
                        placeholder="https://facebook.com/yourpage"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono normal-case ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold opacity-70 mb-1">
                        YouTube Channel URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.socialYoutube}
                        onChange={(e) => setFooterForm({ ...footerForm, socialYoutube: e.target.value })}
                        placeholder="https://youtube.com/@yourchannel"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono normal-case ${inputClass}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold opacity-70 mb-1">
                        WhatsApp Direct Chat URL / Number
                      </label>
                      <input
                        type="text"
                        value={footerForm.socialWhatsapp}
                        onChange={(e) => setFooterForm({ ...footerForm, socialWhatsapp: e.target.value })}
                        placeholder="https://wa.me/919000000000 or 919000000000"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono normal-case ${inputClass}`}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold opacity-70 mb-1">
                        X (Twitter) Profile URL
                      </label>
                      <input
                        type="url"
                        value={footerForm.socialTwitter}
                        onChange={(e) => setFooterForm({ ...footerForm, socialTwitter: e.target.value })}
                        placeholder="https://x.com/yourhandle"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono normal-case ${inputClass}`}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/25 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Footer & Studio Settings</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 9: SECURITY & PASSWORDS CONTROL (Admin Only)                  */}
        {/* ================================================================= */}
        {activeTab === "security" && authRole === "admin" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold">Studio Passwords & Staff Easy Entry Control</h2>
              <p className="text-xs opacity-60 mt-0.5">
                Configure credentials for Master Admin access and Employee Quick Access. Changes apply immediately.
              </p>
            </div>

            {passwordSavedMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSavedMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePasswords} className={`${cardClass} border rounded-3xl p-6 sm:p-8 space-y-6`}>
              
              {/* Master Admin Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500 shrink-0" />
                    <label className="text-xs font-mono flex flex-wrap items-center gap-1.5">
                      <span className="font-bold uppercase tracking-wider">Master Admin Password</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal normal-case">
                        (Current:{" "}
                        {showCurrentAdminPass ? (
                          <code className="font-mono font-bold text-red-600 dark:text-red-400 normal-case px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {settings.admin_password || "cars9pass"}
                          </code>
                        ) : (
                          <span className="font-mono tracking-widest text-slate-400">••••••••</span>
                        )}
                        )
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCurrentAdminPass(!showCurrentAdminPass)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition flex items-center gap-1 text-[11px] font-mono font-bold"
                    title={showCurrentAdminPass ? "Hide Current Password" : "Show Current Password"}
                  >
                    {showCurrentAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showCurrentAdminPass ? "Hide" : "Show"}</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Enter new admin password..."
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono normal-case ${inputClass}`}
                />
                <p className="text-[11px] opacity-60">
                  Controls full access to Hero Banners, Product Inventory, PLP/PDP switches, and Security settings.
                </p>
              </div>

              {/* Staff Easy Access Password */}
              <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                    <label className="text-xs font-mono flex flex-wrap items-center gap-1.5">
                      <span className="font-bold uppercase tracking-wider">Staff Easy Access Password</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal normal-case">
                        (Current:{" "}
                        {showCurrentStaffPass ? (
                          <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400 normal-case px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {settings.staff_password || "cars9staff"}
                          </code>
                        ) : (
                          <span className="font-mono tracking-widest text-slate-400">••••••••</span>
                        )}
                        )
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCurrentStaffPass(!showCurrentStaffPass)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition flex items-center gap-1 text-[11px] font-mono font-bold"
                    title={showCurrentStaffPass ? "Hide Current Password" : "Show Current Password"}
                  >
                    {showCurrentStaffPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showCurrentStaffPass ? "Hide" : "Show"}</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Enter new staff quick-entry password..."
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono normal-case ${inputClass}`}
                />
                <p className="text-[11px] opacity-60">
                  Provide this password to your studio employees. Employees can log in via <strong>&ldquo;Staff Easy Entry&rdquo;</strong> with this password only, gaining direct access strictly to <strong>Enquiries</strong> and <strong>Warranty Manager</strong>.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-md"
              >
                Save New Passwords
              </button>
            </form>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 8: TELEGRAM CDN & MEDIA ASSET HUB                             */}
        {/* ================================================================= */}
        {activeTab === "uploader" && authRole === "admin" && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header & Architecture Card */}
            <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-2">
                    <Send className="w-3.5 h-3.5" />
                    <span>Telegram Distributed Cloud CDN</span>
                  </div>
                  <h2 className="text-2xl font-black">Telegram Media & Asset CDN</h2>
                  <p className="text-xs opacity-70 mt-1 max-w-xl">
                    High-speed automotive media storage streaming directly from Telegram&apos;s global CDN edge servers. Zero hosting bills, unlimited file storage, and persistent image hosting that never resets on server restarts.
                  </p>
                </div>

                {/* Connection Status Badge */}
                <div className={`px-4 py-3 rounded-2xl border text-xs font-mono flex items-center gap-2.5 shrink-0 ${
                  tgStatus?.ok 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    tgStatus?.ok ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`} />
                  <div>
                    <span className="font-bold block">
                      {tgStatus?.ok ? "CDN Connected & Active" : "Local Storage Fallback"}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {tgStatus?.ok ? `@${tgStatus.username || tgStatus.botName}` : "Running on /public/uploads/"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Telegram Bot Credentials & Verification Form */}
            <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 space-y-5`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Bot & Channel Configuration</h3>
                  <p className="text-xs opacity-60">
                    Configure your Telegram Bot token and storage channel ID. Saved securely to database settings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchTelegramStatus}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Status</span>
                </button>
              </div>

              <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold opacity-70 mb-1.5">
                      TELEGRAM_BOT_TOKEN
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. 7123456789:AAHxxxxx_xxxxxxxxxxxxx"
                      value={tgBotToken}
                      onChange={(e) => setTgBotToken(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono ${inputClass}`}
                    />
                    <span className="text-[10px] opacity-50 font-mono mt-1 block">
                      From @BotFather on Telegram
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold opacity-70 mb-1.5">
                      TELEGRAM_CHAT_ID (Channel / Group)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. -100xxxxxxxxxx or chat ID"
                      value={tgChatId}
                      onChange={(e) => setTgChatId(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono ${inputClass}`}
                    />
                    <span className="text-[10px] opacity-50 font-mono mt-1 block">
                      Target channel where images are stored
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs font-mono">
                    {tgMsg && (
                      <span className={tgMsg.includes("success") ? "text-emerald-500 font-bold" : "text-amber-500"}>
                        {tgMsg}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={testingTg}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testingTg ? "Verifying & Saving..." : "Verify & Save Telegram CDN"}</span>
                  </button>
                </div>
              </form>

              {/* Quick 3-Step Setup Instructions Accordion */}
              <div className={`p-4 rounded-2xl border ${innerCardClass} space-y-2 text-xs`}>
                <span className="font-bold opacity-80 block text-[11px] uppercase tracking-wider font-mono">
                  Quick 60-Second Setup Guide:
                </span>
                <ol className="list-decimal list-inside space-y-1 opacity-70 font-mono text-[11px] leading-relaxed">
                  <li>Open Telegram and search for <b>@BotFather</b> &rarr; send <code className="bg-red-500/10 text-red-500 px-1 py-0.5 rounded">/newbot</code> &rarr; copy the HTTP API Token.</li>
                  <li>Create a new Telegram Channel (e.g. <i>&quot;Cars9 Media Vault&quot;</i>) and add your bot as an <b>Administrator</b>.</li>
                  <li>Forward any message from that channel to <b>@userinfobot</b> or <b>@JsonDumpBot</b> to get the Channel ID (starts with <code className="font-mono text-red-500">-100</code>). Paste both above and click Verify!</li>
                </ol>
              </div>
            </div>

            {/* Direct Uploader & CDN Streamer Test Bench */}
            <div className={`${cardClass} border rounded-3xl p-6 sm:p-8 space-y-5`}>
              <div>
                <h3 className="text-lg font-bold">Live Media Asset Uploader</h3>
                <p className="text-xs opacity-60">
                  Select or drop an image to upload. Automatically streams to Telegram CDN and generates a permanent <code className="text-red-500 font-mono">/api/images/[file_id]</code> route.
                </p>
              </div>

              <form onSubmit={handleUploadImage} className="space-y-4">
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center space-y-3 ${innerCardClass}`}>
                  <UploadCloud className="w-10 h-10 text-red-500 opacity-60 mx-auto" />
                  <div className="text-xs opacity-80 font-mono font-semibold">
                    Select high-resolution product photography or banner
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="text-xs opacity-80 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? "Streaming to Telegram CDN..." : "Upload Image to CDN"}</span>
                </button>
              </form>

              {uploadedUrl && (
                <div className={`p-4 rounded-2xl border ${innerCardClass} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-500 uppercase font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Upload Successful & Streamed</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-50">
                      Permanent Cloud Route
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-slate-700">
                      <img
                        src={getDisplayImageUrl(uploadedUrl)}
                        alt="Uploaded Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={uploadedUrl}
                          className={`flex-1 px-3 py-2 rounded-lg border text-xs font-mono ${inputClass}`}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(uploadedUrl);
                            alert("Image CDN URL copied to clipboard!");
                          }}
                          className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-mono font-bold text-white shrink-0"
                        >
                          Copy URL
                        </button>
                      </div>
                      <p className="text-[10px] opacity-60 font-mono">
                        This URL can be pasted into any product slot or banner image field.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* CUSTOM DELETE CONFIRMATION ALERT MODAL                           */}
        {/* ================================================================= */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className={`border rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 ${
              isDark
                ? "bg-slate-900 border-slate-800 text-white"
                : "bg-white border-slate-200 text-slate-950 shadow-xl"
            }`}>
              <div className="flex items-start gap-3.5">
                <div className={`p-3 rounded-2xl shrink-0 ${deleteModal.isPermanent ? "bg-red-600/20 text-red-500" : "bg-amber-500/20 text-amber-500"}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
                    {deleteModal.title || "Confirm Delete"}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {deleteModal.description}
                  </p>
                </div>
              </div>

              {deleteModal.part && (
                <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  isDark
                    ? "bg-slate-800/90 border-slate-700 text-slate-100"
                    : "bg-slate-100 border-slate-300 text-slate-950"
                }`}>
                  <img
                    src={getDisplayImageUrl(deleteModal.part.imageUrl || (deleteModal.part.images && deleteModal.part.images[0]))}
                    alt={deleteModal.part.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-300 dark:border-slate-700"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className={`font-bold text-xs truncate ${isDark ? "text-white" : "text-slate-950"}`}>
                      {deleteModal.part.name}
                    </h4>
                    <div className={`text-[11px] font-mono flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <span>{deleteModal.part.brand} {deleteModal.part.subbrand}</span>
                      <span>•</span>
                      <span>SKU: {deleteModal.part.sku}</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-red-600 dark:text-red-400 mt-0.5">
                      ₹{deleteModal.part.price?.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              )}

              <div className={`flex items-center justify-end gap-2.5 pt-2 border-t ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}>
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: false })}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition ${
                    isDark
                      ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100 shadow-sm"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteModal.isPermanent) {
                      executePermanentDelete();
                    } else if (deleteModal.part) {
                      executeSoftDelete(deleteModal.part);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleteModal.isPermanent ? "Confirm Permanent Delete" : "Confirm Delete"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* PRINTABLE QUOTATION MODAL (Matching Customer Preview Bill 1:1)   */}
        {/* ================================================================= */}
        {showPrintQuoteModal && selectedEnquiry && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
            <div className="relative w-full max-w-4xl space-y-4 my-8">
              {/* Action Bar */}
              <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    Official Studio Quotation Invoice Preview
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleOpenPrintQuote}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Official PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrintQuoteModal(false)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* OFFICIAL STUDIO QUOTATION INVOICE (Exact match to Customer Preview Bill) */}
              <div className="bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-slate-900 dark:text-slate-100">
                
                {/* Top Invoice Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <Cars9Logo size="md" href="/" />
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Custom Automotive Studio • Precision Coupler Fitment • Dust-Free Bay
                    </p>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                      <ShieldCheck className="w-4 h-4" />
                      <span>100% Zero Wire Slicing Guarantee</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      QUOTATION REF: {selectedEnquiry.id}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Date: {new Date(selectedEnquiry.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Valid for: 15 Days from Date of Issue
                    </div>
                  </div>
                </div>

                {/* Customer & Vehicle Information Block */}
                <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-[#161e31]/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      CLIENT DETAILS
                    </span>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {selectedEnquiry.customerName}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 font-mono">
                      Phone: {selectedEnquiry.customerPhone}
                    </div>
                    {selectedEnquiry.customerEmail && (
                      <div className="text-slate-600 dark:text-slate-400 font-mono">
                        Email: {selectedEnquiry.customerEmail}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      VEHICLE SPECIFICATION & FITMENT
                    </span>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {selectedEnquiry.vehicleBrand} {selectedEnquiry.vehicleModel}
                    </div>
                    {selectedEnquiry.vehicleYear && (
                      <div className="text-slate-600 dark:text-slate-400 font-mono">
                        Model Year: {selectedEnquiry.vehicleYear}
                      </div>
                    )}
                    {selectedEnquiry.notes && (
                      <div className="text-slate-500 dark:text-slate-400 italic text-[11px] mt-1">
                        Special notes: &ldquo;{selectedEnquiry.notes}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                {/* Itemized Table With Confirmed Pricing */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-2">#</th>
                        <th className="py-3 px-4">Component & Specification</th>
                        <th className="py-3 px-3 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Unit Price</th>
                        <th className="py-3 px-4 text-right">Installation Charges</th>
                        <th className="py-3 px-4 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {pricingItems.map((item, idx) => {
                        const uPrice = Number(item.unitPrice) || 0;
                        const uLabor = Number(item.installationCharge ?? item.laborCharge) || 0;
                        const lineTotal = (uPrice * (Number(item.quantity) || 1)) + uLabor;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3.5 px-2 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                              <div className="text-[10px] font-mono text-slate-400">
                                SKU: {item.sku} • {item.brand} {item.subbrand}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono font-bold">{item.quantity || 1}</td>
                            <td className="py-3.5 px-4 text-right font-mono">
                              ₹{uPrice.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                              ₹{uLabor.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ₹{lineTotal.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-6">
                  <div className="max-w-sm space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase font-mono text-[10px]">
                      Installation Terms & Studio Protocol:
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      • 100% Coupler-to-coupler fitment. Zero wire splicing guarantee protects vehicle manufacturer warranty.
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      • All installations conducted in closed dust-free studio bays by certified master audio & electrical technicians.
                    </p>
                  </div>

                  <div className="w-full sm:w-80 space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                      <span>Components Subtotal:</span>
                      <span className="font-bold">₹{quoteSubtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                      <span>Installation Charges:</span>
                      <span className="font-bold">₹{quoteInstallationTotal.toLocaleString("en-IN")}</span>
                    </div>
                    {Number(quoteDiscount) > 0 && (
                      <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Studio Promotional Discount:</span>
                        <span>-₹{Number(quoteDiscount).toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {isGstEnabled ? (
                      <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                        <span>GST ({customGstRate}%):</span>
                        <span className="font-bold">₹{quoteGst.toLocaleString("en-IN")}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                        <span>GST:</span>
                        <span className="font-bold text-amber-500">Exempted / 0%</span>
                      </div>
                    )}
                    <div className="flex justify-between py-3 border-t-2 border-slate-900 dark:border-white text-base font-black text-slate-900 dark:text-white">
                      <span>GRAND TOTAL:</span>
                      <span className="text-red-600 dark:text-red-400">
                        ₹{quoteGrandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signature & Authorisation */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs text-slate-400 font-mono">
                  <div>
                    <span>Authorized Studio Technician / Bay Lead</span>
                    <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700 w-48 mt-1" />
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-bold">CARS9 STUDIO</span>
                    <div>Bengaluru, Karnataka, India</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 5-SECOND FLOATING UNDO BANNER                                    */}
        {/* ================================================================= */}
        {undoItem && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
            <div className={`p-4 rounded-2xl border-2 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3.5 ${
              isDark
                ? "bg-slate-950/95 text-white border-red-500/60"
                : "bg-white/95 text-slate-950 border-red-500 shadow-2xl"
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-red-600/15 text-red-600">
                  <Trash2 className="w-5 h-5 animate-pulse" />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                    {undoCountdown}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-950"}`}>
                    Deleted &quot;{undoItem.name}&quot;
                  </div>
                  <div className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Moved to Recycle Bin • Recovers in {undoCountdown}s
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleUndoDelete}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition active:scale-95"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>Undo ({undoCountdown}s)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
                    setUndoItem(null);
                  }}
                  className={`p-1.5 rounded-lg transition ${
                    isDark ? "opacity-50 hover:opacity-100 text-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TOAST NOTICE NOTIFICATION                                         */}
        {/* ================================================================= */}
        {toastNotice && (
          <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-3 duration-300">
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold ${
              toastNotice.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
                : toastNotice.type === "error"
                ? "bg-red-950/90 text-red-200 border-red-500/40"
                : "bg-slate-900/90 text-white border-slate-700"
            }`}>
              {toastNotice.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : toastNotice.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>{toastNotice.text}</span>
              <button
                type="button"
                onClick={() => setToastNotice(null)}
                className="ml-2 p-0.5 rounded-lg opacity-60 hover:opacity-100 transition"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
