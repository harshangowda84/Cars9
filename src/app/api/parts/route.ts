import { NextResponse } from 'next/server';
import { db } from '@/db';
import { parts } from '@/db/schema';
import { desc, eq, and, like } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const subbrand = searchParams.get('subbrand');
    const year = searchParams.get('year');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase().trim();
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true' || searchParams.get('recycleBin') === 'true';

    const allParts = await db.select().from(parts).orderBy(desc(parts.id));
    
    // Parse JSON fields
    const parsed = allParts.map((p: any) => {
      let imagesList: string[] = [];
      if (p.images) {
        try {
          imagesList = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        } catch {
          imagesList = [p.imageUrl || ''];
        }
      } else if (p.imageUrl) {
        imagesList = [p.imageUrl];
      }

      let compatYears: string[] = ['All'];
      if (p.compatibleYears) {
        try {
          compatYears = typeof p.compatibleYears === 'string' ? JSON.parse(p.compatibleYears) : p.compatibleYears;
        } catch {
          compatYears = ['All'];
        }
      }

      let specsObj: Record<string, string> = {};
      if (p.specifications) {
        try {
          specsObj = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
        } catch {
          specsObj = {};
        }
      }

      return {
        ...p,
        isDeleted: Boolean(p.isDeleted),
        deletedAt: p.deletedAt || null,
        images: imagesList,
        compatibleYears: compatYears,
        specifications: specsObj,
      };
    });

    // Filtering logic
    const filtered = parsed.filter((item: any) => {
      // Recycle bin / soft-delete filter
      if (onlyDeleted) {
        if (!item.isDeleted) return false;
      } else if (!includeDeleted) {
        if (item.isDeleted) return false;
      }

      // Brand filter
      if (brand && brand !== 'all' && brand.toLowerCase() !== 'all') {
        const matchBrand = item.brand.toLowerCase() === brand.toLowerCase() || item.brand.toLowerCase() === 'universal';
        if (!matchBrand) return false;
      }

      // Subbrand / Model filter
      if (subbrand && subbrand !== 'all' && subbrand.toLowerCase() !== 'all') {
        const matchSub = item.subbrand.toLowerCase() === subbrand.toLowerCase() || item.subbrand.toLowerCase() === 'all models' || item.brand.toLowerCase() === 'universal';
        if (!matchSub) return false;
      }

      // Year filter
      if (year && year !== 'all') {
        const matchYear = item.compatibleYears.includes('All') || item.compatibleYears.includes(year);
        if (!matchYear) return false;
      }

      // Category filter
      if (category && category !== 'All') {
        if (item.category !== category) return false;
      }

      // Global search filter
      if (search) {
        const haystack = `${item.name} ${item.brand} ${item.subbrand} ${item.sku} ${item.description} ${item.category}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newId = `C9-${body.category?.substring(0, 3).toUpperCase() || 'ACC'}-${Math.floor(Math.random() * 900) + 100}`;

    const newPart = {
      id: newId,
      name: body.name,
      brand: body.brand || 'Universal',
      subbrand: body.subbrand || 'All Models',
      category: body.category || 'Accessories',
      sku: body.sku || `C9-SKU-${Date.now().toString().slice(-6)}`,
      description: body.description || '',
      price: Number(body.price) || 0,
      stock: Number(body.stock) || 1,
      location: body.location || 'Studio Shelf A',
      imageUrl: body.imageUrl || (Array.isArray(body.images) && body.images[0]) || null,
      images: JSON.stringify(body.images || (body.imageUrl ? [body.imageUrl] : [])),
      videoUrl: body.videoUrl || null,
      compatibleYears: JSON.stringify(body.compatibleYears || ['All']),
      badge: body.badge || null,
      warrantyMonths: Number(body.warrantyMonths) || 12,
      specifications: JSON.stringify(body.specifications || {}),
      isDeleted: false,
      deletedAt: null,
    };

    await db.insert(parts).values(newPart);

    return NextResponse.json({
      ...newPart,
      images: body.images || [],
      compatibleYears: body.compatibleYears || ['All'],
      specifications: body.specifications || {},
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Bulk / Filter-wise Permanent Deletion from Recycle Bin
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const urlAll = searchParams.get('all') === 'true';
    const urlBrand = searchParams.get('brand');
    const urlCategory = searchParams.get('category');
    const urlIds = searchParams.get('ids');

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const isAll = body.all !== undefined ? Boolean(body.all) : urlAll;
    const targetBrand = body.brand || urlBrand;
    const targetCategory = body.category || urlCategory;
    const targetIds: string[] = body.ids || (urlIds ? urlIds.split(',').map((s: string) => s.trim()).filter(Boolean) : []);

    // Fetch all deleted records
    const allDeleted = await db.select().from(parts).where(eq(parts.isDeleted, true));

    let toDelete = allDeleted;
    if (!isAll && targetIds.length > 0) {
      toDelete = toDelete.filter((p: any) => targetIds.includes(p.id));
    }
    if (targetBrand && targetBrand !== 'all') {
      toDelete = toDelete.filter((p: any) => p.brand.toLowerCase() === targetBrand.toLowerCase());
    }
    if (targetCategory && targetCategory !== 'All') {
      toDelete = toDelete.filter((p: any) => p.category === targetCategory);
    }

    if (toDelete.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No deleted items match the criteria" });
    }

    for (const item of toDelete) {
      await db.delete(parts).where(eq(parts.id, item.id));
    }

    return NextResponse.json({
      success: true,
      count: toDelete.length,
      deletedIds: toDelete.map((p: any) => p.id),
      message: `Permanently removed ${toDelete.length} item(s) from Recycle Bin`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Bulk / Filter-wise Restore from Recycle Bin
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, ids, all, brand, category, oldCategory, newCategory } = body;

    // Batch rename/reassign category across products
    if (action === 'update_category' || (oldCategory && newCategory)) {
      const targetOld = String(oldCategory).trim();
      const targetNew = String(newCategory).trim();
      if (!targetOld || !targetNew) {
        return NextResponse.json({ error: "Missing oldCategory or newCategory" }, { status: 400 });
      }

      await db.update(parts).set({ category: targetNew }).where(eq(parts.category, targetOld));
      return NextResponse.json({
        success: true,
        message: `Reassigned all items from "${targetOld}" to "${targetNew}"`,
      });
    }

    if (action === 'restore') {
      const allDeleted = await db.select().from(parts).where(eq(parts.isDeleted, true));

      let toRestore = allDeleted;
      if (!all && Array.isArray(ids) && ids.length > 0) {
        toRestore = toRestore.filter((p: any) => ids.includes(p.id));
      }
      if (brand && brand !== 'all') {
        toRestore = toRestore.filter((p: any) => p.brand.toLowerCase() === brand.toLowerCase());
      }
      if (category && category !== 'All') {
        toRestore = toRestore.filter((p: any) => p.category === category);
      }

      for (const item of toRestore) {
        await db.update(parts).set({
          isDeleted: false,
          deletedAt: null,
        }).where(eq(parts.id, item.id));
      }

      return NextResponse.json({
        success: true,
        count: toRestore.length,
        restoredIds: toRestore.map((p: any) => p.id),
        message: `Restored ${toRestore.length} item(s) to catalog`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
