import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) return ips[0];
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim();
  return "127.0.0.1";
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown Device";
  let os = "Unknown OS";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  let browser = "Browser";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/opera|opr/i.test(ua)) browser = "Opera";

  return `${browser} on ${os}`;
}

async function recordLoginAudit({
  ip,
  role,
  status,
  userAgent,
  detail,
}: {
  ip: string;
  role: "admin" | "staff";
  status: "success" | "failed";
  userAgent: string;
  detail: string;
}) {
  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "admin_login_history"));
    let history: any[] = [];
    if (rows.length > 0) {
      try {
        history = JSON.parse(rows[0].value);
      } catch {
        history = [];
      }
    }
    const newEntry = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      ip,
      role,
      status,
      userAgent,
      detail,
    };
    history.unshift(newEntry);
    if (history.length > 60) {
      history = history.slice(0, 60);
    }
    const val = JSON.stringify(history);
    await db.delete(siteSettings).where(eq(siteSettings.key, "admin_login_history"));
    await db.insert(siteSettings).values({ key: "admin_login_history", value: val });
  } catch (err) {
    console.error("Failed to record login audit history:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username = "", password = "", mode = "admin" } = body;
    const clientIp = getClientIp(request);
    const userAgentDesc = parseUserAgent(request.headers.get("user-agent"));

    // Fetch configured passwords from DB
    let configuredAdminPass = process.env.ADMIN_PASSWORD || "cars9pass";
    let configuredStaffPass = process.env.STAFF_PASSWORD || "cars9staff";

    try {
      const rows = await db.select().from(siteSettings);
      for (const r of rows) {
        if (r.key === "admin_password") {
          try {
            configuredAdminPass = JSON.parse(r.value);
          } catch {
            configuredAdminPass = r.value;
          }
        }
        if (r.key === "staff_password") {
          try {
            configuredStaffPass = JSON.parse(r.value);
          } catch {
            configuredStaffPass = r.value;
          }
        }
      }
    } catch (err) {
      console.warn("DB settings fetch error during auth, using defaults:", err);
    }

    if (mode === "admin") {
      const isValidPass = password === configuredAdminPass;

      if (!isValidPass) {
        await recordLoginAudit({
          ip: clientIp,
          role: "admin",
          status: "failed",
          userAgent: userAgentDesc,
          detail: "Failed Master Admin login attempt (wrong password)",
        });

        return NextResponse.json(
          { error: "Invalid admin password. Access restricted." },
          { status: 401 }
        );
      }

      await recordLoginAudit({
        ip: clientIp,
        role: "admin",
        status: "success",
        userAgent: userAgentDesc,
        detail: "Master Admin authenticated successfully",
      });

      const adminUser = (typeof username === "string" && username.trim()) || "Master Admin";
      const token = await createSessionToken({
        username: adminUser,
        role: "admin",
      });

      const response = NextResponse.json({
        success: true,
        user: { username: adminUser, role: "admin" },
      });

      setSessionCookie(response, token);
      return response;
    } else if (mode === "staff") {
      const isValidPass = password === configuredStaffPass;

      if (!isValidPass) {
        await recordLoginAudit({
          ip: clientIp,
          role: "staff",
          status: "failed",
          userAgent: userAgentDesc,
          detail: "Failed Staff access attempt (wrong password)",
        });

        return NextResponse.json(
          { error: "Invalid staff access password. Access restricted." },
          { status: 401 }
        );
      }

      await recordLoginAudit({
        ip: clientIp,
        role: "staff",
        status: "success",
        userAgent: userAgentDesc,
        detail: "Studio Staff authenticated successfully",
      });

      const token = await createSessionToken({
        username: "Studio Staff",
        role: "staff",
      });

      const response = NextResponse.json({
        success: true,
        user: { username: "Studio Staff", role: "staff" },
      });

      setSessionCookie(response, token);
      return response;
    } else {
      return NextResponse.json({ error: "Invalid login mode" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Login route error:", err);
    return NextResponse.json({ error: err.message || "Authentication error" }, { status: 500 });
  }
}
