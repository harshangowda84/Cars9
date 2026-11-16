import { NextResponse } from 'next/server';
import { db } from '@/db';
import { siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brandIds = body.brandIds || body.order || [];

    if (!Array.isArray(brandIds)) {
      return NextResponse.json({ error: "brandIds must be an array of brand IDs" }, { status: 400 });
    }

    const strVal = JSON.stringify(brandIds);
    try {
      await db.delete(siteSettings).where(eq(siteSettings.key, 'brand_order'));
      await db.insert(siteSettings).values({ key: 'brand_order', value: strVal });
    } catch (dbErr: any) {
      console.error("Error writing brand_order to siteSettings:", dbErr);
    }

    return NextResponse.json({ success: true, brandOrder: brandIds }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const row = await db.select().from(siteSettings).where(eq(siteSettings.key, 'brand_order'));
    let brandOrder: string[] = [];
    if (row.length > 0 && row[0].value) {
      try {
        brandOrder = JSON.parse(row[0].value);
      } catch {
        brandOrder = [];
      }
    }
    return NextResponse.json({ brandOrder }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
