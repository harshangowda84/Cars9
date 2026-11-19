import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Master Admin session required" },
        { status: 401 }
      );
    }

    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "admin_login_history"));

    let history: any[] = [];
    if (rows.length > 0) {
      try {
        history = JSON.parse(rows[0].value);
      } catch {
        history = [];
      }
    }

    return NextResponse.json({ history }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch login history:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch login history" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Master Admin session required" },
        { status: 401 }
      );
    }

    await db
      .delete(siteSettings)
      .where(eq(siteSettings.key, "admin_login_history"));

    await db
      .insert(siteSettings)
      .values({ key: "admin_login_history", value: "[]" });

    return NextResponse.json({ success: true, message: "Login history cleared successfully" });
  } catch (err: any) {
    console.error("Failed to clear login history:", err);
    return NextResponse.json(
      { error: err.message || "Failed to clear login history" },
      { status: 500 }
    );
  }
}
