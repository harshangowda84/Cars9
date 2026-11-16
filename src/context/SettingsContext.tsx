"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface SiteSettings {
  // Passwords
  admin_password?: string;
  staff_password?: string;

  // Site Logo & Branding
  site_logo_url?: string;
  site_name?: string;

  // Footer Information Controls
  footer_description?: string;
  footer_guarantee_text?: string;
  footer_phone?: string;
  footer_email?: string;
  footer_address?: string;
  footer_maps_url?: string;
  footer_timings?: string;
  footer_copyright?: string;
  footer_show_warranty_link?: boolean;
  footer_show_pricing_link?: boolean;
  footer_show_admin_link?: boolean;
  footer_social_instagram?: string;
  footer_social_facebook?: string;
  footer_social_youtube?: string;
  footer_social_whatsapp?: string;
  footer_social_twitter?: string;

  // WhatsApp Direct Routing Numbers
  whatsapp_master_phone?: string;
  whatsapp_card_phone?: string;
  whatsapp_footer_phone?: string;
  whatsapp_pdp_phone?: string;
  whatsapp_quotation_phone?: string;

  // Car Brands Custom Homepage Display Order
  brand_order?: string[];

  // Fallback Default Hero Banner (Shown when no active banners)
  default_banner_title1?: string;
  default_banner_title2?: string;
  default_banner_subtitle?: string;
  default_banner_cta?: string;
  default_banner_image?: string;
  default_banner_image_light?: string;

  // PLP Settings
  plp_showQuickPreview: boolean;
  plp_showCouplerBadge: boolean;
  plp_showMediaCountPill: boolean;
  plp_showVideo: boolean;
  plp_showCategoryTabs: boolean;
  plp_showVehicleCascade: boolean;
  plp_showBadges: boolean;
  plp_enableHoverZoom: boolean;
  plp_enableHoverSlideshow: boolean;
  plp_slideshowInterval: number;
  plp_showShareButton: boolean;

  // PDP Settings
  pdp_showCadSchematic: boolean;
  pdp_showVideoPlayer: boolean;
  pdp_showWhatsAppEnquiry: boolean;
  pdp_showDirectShareLink: boolean;
  pdp_showQuantitySelector: boolean;
  pdp_showCompatibilityBanner: boolean;
  pdp_showBayTimeEstimate: boolean;
  pdp_showSpecsTab: boolean;
  pdp_showWhatsInBoxTab: boolean;
  pdp_showInstallationProtocolTab: boolean;
  pdp_showRelatedProducts: boolean;
  pdp_enableSlideshow: boolean;
  pdp_slideshowInterval: number;
  [key: string]: any;
}

const defaultSettings: SiteSettings = {
  admin_password: "cars9pass",
  staff_password: "cars9staff",

  site_logo_url: "/images/cars9-logo.png",
  site_name: "CARS9 Automotive Studio",

  footer_description: "India's premier custom automotive accessory studio. OEM coupler-to-coupler fitment, precision sound engineering, QLED digital touchscreens, and European laser optics.",
  footer_guarantee_text: "100% Zero Wire Slicing Guarantee",
  footer_phone: "+91 90000 00000 / +91 98888 88888",
  footer_email: "concierge@cars9studio.com",
  footer_address: "Main Studio Bay, HSR Layout / Indiranagar, Bangalore",
  footer_maps_url: "https://maps.google.com/?q=Cars9+Automotive+Studio+Bangalore",
  footer_timings: "Monday – Saturday: 10:00 AM – 8:30 PM\nSunday: By Prior Appointment Only\nDust-Free Closed Installation Bays\nPrecision Acoustic Calibration Bay",
  footer_copyright: "© {year} CARS9 Automotive Studio. All rights reserved.",
  footer_show_warranty_link: true,
  footer_show_pricing_link: true,
  footer_show_admin_link: true,
  footer_social_instagram: "https://instagram.com/cars9studio",
  footer_social_facebook: "https://facebook.com/cars9studio",
  footer_social_youtube: "https://youtube.com/@cars9studio",
  footer_social_whatsapp: "https://wa.me/919000000000",
  footer_social_twitter: "https://x.com/cars9studio",

  // WhatsApp Direct Routing Numbers
  whatsapp_master_phone: "+91 90000 00000",
  whatsapp_card_phone: "",
  whatsapp_footer_phone: "",
  whatsapp_pdp_phone: "",
  whatsapp_quotation_phone: "",

  brand_order: [],

  default_banner_title1: "ELEVATE YOUR CAR WITH",
  default_banner_title2: "CUSTOM ACCESSORIES",
  default_banner_subtitle: "Discover custom 7D floor mats, Nappa leatherette seat covers, app-controlled ambient lighting, 4K dual-lens dash cams, and off-road enhancements engineered to fit your exact vehicle model.",
  default_banner_cta: "EXPLORE BRANDS",
  default_banner_image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1920&auto=format&fit=crop",
  default_banner_image_light: "",

  plp_showQuickPreview: true,
  plp_showCouplerBadge: true,
  plp_showMediaCountPill: true,
  plp_showVideo: true,
  plp_showCategoryTabs: true,
  plp_showVehicleCascade: true,
  plp_showBadges: true,
  plp_enableHoverZoom: true,
  plp_enableHoverSlideshow: true,
  plp_slideshowInterval: 1.5,
  plp_showShareButton: true,

  pdp_showCadSchematic: true,
  pdp_showVideoPlayer: true,
  pdp_showWhatsAppEnquiry: true,
  pdp_showDirectShareLink: true,
  pdp_showQuantitySelector: true,
  pdp_showCompatibilityBanner: true,
  pdp_showBayTimeEstimate: true,
  pdp_showSpecsTab: true,
  pdp_showWhatsInBoxTab: true,
  pdp_showInstallationProtocolTab: true,
  pdp_showRelatedProducts: true,
  pdp_enableSlideshow: true,
  pdp_slideshowInterval: 2,
};

interface SettingsContextType {
  settings: SiteSettings;
  updateSetting: (key: string, value: any) => Promise<void>;
  reloadSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSetting: async () => {},
  reloadSettings: async () => {},
  loading: false,
});

const SETTINGS_STORAGE_KEY = "cars9_site_settings";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // 1. Initial load: check localStorage first for instant paint, then sync with server
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.warn("Failed reading cached settings", e);
      }
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings", { 
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => {
          const updated = { ...prev, ...data };
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
          }
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to load site settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Listen for storage events (changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          setSettings((prev) => ({ ...prev, ...updated }));
        } catch {}
      }
    };

    // Listen for custom in-window broadcast
    const handleCustomChange = (e: any) => {
      if (e.detail) {
        setSettings((prev) => ({ ...prev, [e.detail.key]: e.detail.value }));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cars9_settings_change", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cars9_settings_change", handleCustomChange);
    };
  }, []);

  const updateSetting = async (key: string, value: any) => {
    // 1. Optimistic immediate state update
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent("cars9_settings_change", { detail: { key, value } }));
        } catch {}
      }
      return updated;
    });

    // 2. Persist to Hostinger MySQL via API
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (err) {
      console.error("Failed to save setting to backend", err);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        reloadSettings: fetchSettings,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
