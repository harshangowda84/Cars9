"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";
import { getDisplayImageUrl } from "@/lib/imageUrl";

interface Cars9LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  showTagline?: boolean;
}

export function Cars9Logo({
  className = "",
  size = "md",
  href = "/",
  showTagline = true,
}: Cars9LogoProps) {
  const { settings } = useSettings();
  const [imageError, setImageError] = useState(false);

  // Height and width constraints based on size (prominent & crisp on all screens)
  const sizeStyles = {
    sm: "h-9 sm:h-10 w-auto",
    md: "h-12 sm:h-14 w-auto",
    lg: "h-16 sm:h-20 w-auto",
  };

  // Resolve custom logo from admin settings or default official Cars9 logo
  const configuredLogo = settings?.site_logo_url?.trim();
  const defaultLogo = "/images/cars9-logo.png";
  
  // Reset error state when configuredLogo changes
  useEffect(() => {
    setImageError(false);
  }, [configuredLogo]);

  const targetLogo = (!imageError && configuredLogo) ? configuredLogo : defaultLogo;
  const logoSrc = targetLogo.startsWith("/") ? targetLogo : getDisplayImageUrl(targetLogo);

  const logoImage = (
    <div className={`inline-flex items-center select-none group cursor-pointer ${className}`}>
      <div className="relative transition-transform duration-300 group-hover:scale-105">
        {/* Ambient subtle glow */}
        <div className="absolute inset-0 bg-amber-500/10 dark:bg-orange-500/15 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Active Site Logo - Permanent fallback guaranteed */}
        <img
          src={logoSrc}
          alt="Cars9 - Upgrade Your Car in Style"
          className={`${sizeStyles[size]} object-contain drop-shadow-md`}
          onError={() => {
            // At least one logo is always visible
            setImageError(true);
          }}
        />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block focus:outline-none">
        {logoImage}
      </Link>
    );
  }

  return logoImage;
}

export default Cars9Logo;
