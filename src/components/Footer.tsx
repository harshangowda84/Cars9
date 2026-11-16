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
