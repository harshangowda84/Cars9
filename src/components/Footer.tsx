"use client";

import React from "react";
import Link from "next/link";
import { Cars9Logo } from "@/components/Cars9Logo";
import { GoogleMapsLogo } from "@/components/GoogleMapsLogo";
import { useSettings } from "@/context/SettingsContext";
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink 
} from "lucide-react";

interface FooterProps {
  onSelectCategory?: (category: string) => void;
}

export function Footer({ onSelectCategory }: FooterProps) {
  const { settings } = useSettings();

  const currentYear = new Date().getFullYear();

  // Footer dynamic values from admin settings with studio defaults
  const description = settings.footer_description || 
    "India's premier custom automotive accessory studio. OEM coupler-to-coupler fitment, precision sound engineering, QLED digital touchscreens, and European laser optics.";

  const guaranteeText = settings.footer_guarantee_text || "100% Zero Wire Slicing Guarantee";

  const phone = settings.footer_phone || "+91 90000 00000 / +91 98888 88888";
  const email = settings.footer_email || "concierge@cars9studio.com";
  const address = settings.footer_address || "Main Studio Bay, HSR Layout / Indiranagar, Bangalore";
  const mapsUrl = settings.footer_maps_url || "https://maps.google.com/?q=Cars9+Automotive+Studio+Bangalore";

  const rawTimings = settings.footer_timings || 
    "Monday – Saturday: 10:00 AM – 8:30 PM\nSunday: By Prior Appointment Only\nDust-Free Closed Installation Bays\nPrecision Acoustic Calibration Bay";
  const timingsList = rawTimings
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const rawCopyright = settings.footer_copyright || `© ${currentYear} CARS9 Automotive Studio. All rights reserved.`;
  const copyrightText = rawCopyright.replace("{year}", currentYear.toString());

  const showWarrantyLink = settings.footer_show_warranty_link !== false;
  const showPricingLink = settings.footer_show_pricing_link !== false;
  const showAdminLink = settings.footer_show_admin_link !== false;

  const handleCategoryClick = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
      const el = document.getElementById("catalog");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="mt-16 sm:mt-20 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0a0e18]/80 backdrop-blur-xl pt-12 sm:pt-14 pb-8 sm:pb-10 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10 pb-10 sm:pb-12 border-b border-slate-200 dark:border-slate-800">
          
          {/* Col 1: Studio Brand & Logo */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Cars9Logo size="md" href="/" />
            </div>
            
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-normal">
              {description}
            </p>
            
            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{guaranteeText}</span>
            </div>

            {/* Social Media Channels */}
            <div className="pt-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Connect With Studio
              </span>
              <div className="flex items-center gap-2">
                {settings.footer_social_instagram && (
                  <a
                    href={settings.footer_social_instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888] hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-xs group"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {settings.footer_social_facebook && (
                  <a
                    href={settings.footer_social_facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-[#1877F2] hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-xs group"
                    title="Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                )}
                {settings.footer_social_youtube && (
                  <a
                    href={settings.footer_social_youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-[#FF0000] hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-xs group"
                    title="YouTube"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}
                {settings.footer_social_whatsapp && (
                  <a
                    href={settings.footer_social_whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-[#25D366] hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-xs group"
                    title="WhatsApp"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 2C6.495 2 2 6.494 2 12.03c0 1.97.57 3.81 1.554 5.37L2 22l4.77-1.523A9.975 9.975 0 0 0 12.031 22c5.535 0 10.03-4.494 10.03-10.03C22.062 6.494 17.566 2 12.031 2zm5.82 14.28c-.24.67-1.39 1.28-1.92 1.34-.49.06-1.12.08-3.6-1.02-2.98-1.32-4.88-4.37-5.03-4.57-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.16 1.02-2.45.27-.29.59-.36.79-.36.2 0 .4 0 .58.01.19.01.44-.07.69.52.26.61.88 2.14.96 2.3.08.15.13.34.02.54-.1.2-.16.32-.31.5-.15.18-.32.4-.46.54-.15.15-.31.32-.13.63.18.31.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.46 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.84.87 2.15 1.03.31.15.52.23.6.36.08.14.08.79-.16 1.46z" />
                    </svg>
                  </a>
                )}
                {settings.footer_social_twitter && (
                  <a
                    href={settings.footer_social_twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-black hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-xs group"
                    title="X (Twitter)"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Accessories Catalog
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick("Infotainment & Audio")}
                  className="hover:text-red-500 transition text-left"
                >
                  DSP Audio & QLED Android Cockpits
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick("Lighting & Electrical")}
                  className="hover:text-red-500 transition text-left"
                >
                  Bi-LED & European Laser Headlamps
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick("Interior Styling")}
                  className="hover:text-red-500 transition text-left"
                >
                  64-Color Symphony Ambient & 7D Mats
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick("Exterior Styling")}
                  className="hover:text-red-500 transition text-left"
                >
                  Dry Carbon Aero Kits & Diffusers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick("Car Care & Utility")}
                  className="hover:text-red-500 transition text-left"
                >
                  4K+2K Stealth Dashcams & Radars
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Studio Bay Working Hours */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Studio Operations
            </span>
            <ul className="space-y-2 text-xs">
              {timingsList.map((time, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-500">•</span>
                  <span>{time}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Studio Contact */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Studio Location & Support
            </span>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>{address}</div>
                  {mapsUrl && (
                    <div>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-red-600 dark:text-red-400 hover:text-red-500 font-semibold transition"
                      >
                        <GoogleMapsLogo className="w-3.5 h-3.5 shrink-0" />
                        <span>View on Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <a href={`tel:${phone.split("/")[0].trim()}`} className="hover:text-emerald-500 transition">
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-500 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-sky-500 transition">
                  {email}
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Links */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-mono">
          <div>{copyrightText}</div>

          <div className="flex items-center gap-4">
            {showWarrantyLink && (
              <Link href="/warranty" className="hover:text-red-500 transition">
                Digital Warranty
              </Link>
            )}
            {showWarrantyLink && showPricingLink && <span>•</span>}
            {showPricingLink && (
              <Link href="/quotation?mode=owner" className="hover:text-amber-500 transition">
                Owner Pricing Tool
              </Link>
            )}
            {showAdminLink && (
              <>
                <span>•</span>
                <Link href="/admin-portal" className="hover:text-slate-200 transition">
                  Admin Portal
                </Link>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
