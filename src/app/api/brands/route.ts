import { NextResponse } from 'next/server';
import { db } from '@/db';
import { brands, subbrands, siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const allBrands = await db.select().from(brands);
    const allSubbrands = await db.select().from(subbrands);

    // Fetch brand order preference from siteSettings
    let brandOrder: string[] = [];
    try {
      const orderSetting = await db.select().from(siteSettings).where(eq(siteSettings.key, 'brand_order'));
      if (orderSetting.length > 0 && orderSetting[0].value) {
        brandOrder = JSON.parse(orderSetting[0].value);
      }
    } catch {
      brandOrder = [];
    }

    const filteredBrands = includeDeleted
      ? allBrands
      : allBrands.filter((b: any) => !b.isDeleted);

    const formattedBrands = filteredBrands.map((b: any, originalIndex: number) => {
      const orderIdx = Array.isArray(brandOrder) ? brandOrder.indexOf(b.id) : -1;
      const computedRank = orderIdx !== -1 ? orderIdx : 1000 + originalIndex;

      return {
        id: b.id,
        name: b.name,
        logo: b.logo || b.logoUrl || null,
        rank: computedRank,
        isDeleted: Boolean(b.isDeleted),
        deletedAt: b.deletedAt || null,
        subbrands: allSubbrands
          .filter((sb: any) => sb.brandId === b.id && (includeDeleted ? true : !sb.isDeleted))
          .map((sb: any) => ({
            id: sb.id,
            name: sb.name,
            imageUrl: sb.imageUrl || null,
            years: typeof sb.years === 'string' ? JSON.parse(sb.years) : (sb.years || []),
            isDeleted: Boolean(sb.isDeleted),
            deletedAt: sb.deletedAt || null,
          }))
      };
    });

    // Sort brands by custom arrange order rank so 1st arranged brand is always first
    formattedBrands.sort((a: any, b: any) => (a.rank ?? 0) - (b.rank ?? 0));

    return NextResponse.json(formattedBrands, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, brandId, years, logo, imageUrl } = body;

    if (type === 'brand') {
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      // Check if brand exists (e.g. was soft-deleted)
      const existing = await db.select().from(brands).where(eq(brands.id, id));
      if (existing.length > 0) {
        await db.update(brands)
          .set({ name, logo: logo || existing[0].logo || null, isDeleted: false, deletedAt: null })
          .where(eq(brands.id, id));
        return NextResponse.json({ id, name, logo: logo || existing[0].logo || null, subbrands: [] });
      }

      await db.insert(brands).values({ 
        id, 
        name, 
        logo: logo || null,
        isDeleted: false,
        deletedAt: null
      });
      return NextResponse.json({ id, name, logo: logo || null, subbrands: [] });
    } else if (type === 'subbrand') {
      if (!brandId) throw new Error("brandId is required for subbrand");
      
      // Check if subbrand already exists for this brand
      const existingSubs = await db.select().from(subbrands).where(eq(subbrands.brandId, brandId));
      const existingMatch = existingSubs.find((s: any) => s.name.toLowerCase().trim() === name.toLowerCase().trim());

      if (existingMatch) {
        await db.update(subbrands)
          .set({ 
            isDeleted: false, 
            deletedAt: null,
            imageUrl: imageUrl || existingMatch.imageUrl || null,
            years: JSON.stringify(years || (typeof existingMatch.years === "string" ? JSON.parse(existingMatch.years) : existingMatch.years) || ["2024", "2023", "2022", "2021", "2020"])
          })
          .where(eq(subbrands.id, existingMatch.id));

        return NextResponse.json({ 
          id: existingMatch.id,
          brandId, 
          name, 
          imageUrl: imageUrl || existingMatch.imageUrl || null,
          years: years || (typeof existingMatch.years === "string" ? JSON.parse(existingMatch.years) : existingMatch.years) || ["2024", "2023", "2022", "2021", "2020"],
          isDeleted: false,
          deletedAt: null
        });
      }

      const newSubbrandData = {
        brandId, 
        name,
        imageUrl: imageUrl || null,
        years: JSON.stringify(years || ["2024", "2023", "2022", "2021", "2020"]),
        isDeleted: false,
        deletedAt: null
      };
      
      await db.insert(subbrands).values(newSubbrandData);

      return NextResponse.json({ 
        brandId, 
        name, 
        imageUrl: imageUrl || null,
        years: years || ["2024", "2023", "2022", "2021", "2020"],
        isDeleted: false,
        deletedAt: null
      });
    }
    
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    console.error("API /api/brands POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
