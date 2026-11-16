import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const defaultSettings: Record<string, any> = {
  // Passwords (internal defaults)
  admin_password: "cars9pass",
  staff_password: "cars9staff",

  // Site Logo & Branding
  site_logo_url: "/images/cars9-logo.png",
  site_name: "CARS9 Automotive Studio",

  // Footer Information Controls
  footer_description: "India's premier custom automotive accessory studio. OEM coupler-to-coupler fitment, precision sound engineering, QLED digital touchscreens, and European laser optics.",
  footer_guarantee_text: "100% Zero Wire Slicing Guarantee",
  footer_phone: "+91 90000 00000 / +91 98888 88888",
  footer_email: "concierge@cars9studio.com",
  footer_address: "Main Studio Bay, HSR Layout / Indiranagar, Bangalore",
  footer_timings: "Monday – Saturday: 10:00 AM – 8:30 PM\nSunday: By Prior Appointment Only\nDust-Free Closed Installation Bays\nPrecision Acoustic Calibration Bay",
  footer_copyright: "© {year} CARS9 Automotive Studio. All rights reserved.",
  footer_show_warranty_link: true,
  footer_show_pricing_link: true,
  footer_show_admin_link: true,

  // PLP Settings (All on/off switches)
  plp_showQuickPreview: true,
  plp_showCouplerBadge: true,
  plp_showMediaCountPill: true,
  plp_showCategoryTabs: true,
  plp_showVehicleCascade: true,
  plp_showBadges: true,
  plp_enableHoverZoom: true,

  // PDP Settings (All on/off switches)
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
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    const rows = await db.select().from(siteSettings);
    
    const settings = { ...defaultSettings };
    for (const r of rows) {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    }

    // Security: Never leak passwords to public storefront visitors
    if (!session || session.role !== "admin") {
      delete settings.admin_password;
      delete settings.staff_password;
    }

    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Failed to get settings from db, returning defaults:', error);
    const safeDefaults = { ...defaultSettings };
    delete safeDefaults.admin_password;
    delete safeDefaults.staff_password;

    return NextResponse.json(safeDefaults, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const updates = await request.json();

    for (const [key, val] of Object.entries(updates)) {
      const strVal = typeof val === 'string' ? val : JSON.stringify(val);
      try {
        // Try delete then insert for universal compatibility across MySQL and SQLite
        await db.delete(siteSettings).where(eq(siteSettings.key, key));
        await db.insert(siteSettings).values({ key, value: strVal });
      } catch (err) {
        console.error(`Error saving setting ${key}:`, err);
      }
    }

    // Return merged updated settings
    const rows = await db.select().from(siteSettings);
    const settings = { ...defaultSettings };
    for (const r of rows) {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    }

    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
