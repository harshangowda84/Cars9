import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username = "", password = "", mode = "admin" } = body;

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
        return NextResponse.json(
          { error: "Invalid admin password. Access restricted." },
          { status: 401 }
        );
      }

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
        return NextResponse.json(
          { error: "Invalid staff access password. Access restricted." },
          { status: 401 }
        );
      }

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
