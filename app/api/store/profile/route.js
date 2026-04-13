import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/src/db";
import authSeller from "@/middlewares/authSeller";
import imagekit from "@/configs/imageKit";
import { defaultLimiter } from "@/lib/rateLimit";
import { sanitizeStoreInput } from "@/lib/sanitize";

/**
 * GET /api/store/profile — fetch current store profile
 * PATCH /api/store/profile — update store profile (name, description, email, contact, address, logo, banner)
 */

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true, name: true, description: true, email: true,
        contact: true, address: true, street: true, city: true,
        state: true, zip: true, country: true,
        logo: true, banner: true, username: true, status: true,
        isActive: true, createdAt: true,
      },
    });

    return NextResponse.json({ store });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingStore = await prisma.store.findUnique({ where: { id: storeId } });

    const formData = await request.formData();

    // Sanitize editable text fields
    const { data: sanitized, errors } = sanitizeStoreInput({
      name:        formData.get("name")        ?? existingStore.name,
      username:    existingStore.username,     // NOT editable after approval
      description: formData.get("description") ?? existingStore.description,
      email:       formData.get("email")       ?? existingStore.email,
      contact:     formData.get("contact")     ?? existingStore.contact,
      address:     formData.get("address")     ?? existingStore.address,
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    // Structured address fields (optional)
    const street  = formData.get("street")  ? formData.get("street").slice(0, 200)  : existingStore.street;
    const city    = formData.get("city")    ? formData.get("city").slice(0, 100)    : existingStore.city;
    const state   = formData.get("state")   ? formData.get("state").slice(0, 100)   : existingStore.state;
    const zip     = formData.get("zip")     ? formData.get("zip").slice(0, 20)      : existingStore.zip;
    const country = formData.get("country") ? formData.get("country").slice(0, 100) : existingStore.country;

    const updateData = { ...sanitized, street, city, state, zip, country };

    // Handle optional logo replacement
    const logoFile = formData.get("logo");
    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const uploaded = await imagekit.upload({
        file: buffer,
        fileName: logoFile.name || `logo-${Date.now()}`,
        folder: "logos",
      });
      updateData.logo = uploaded.url;
    }

    // Handle optional banner image
    const bannerFile = formData.get("banner");
    if (bannerFile && bannerFile instanceof File && bannerFile.size > 0) {
      const buffer = Buffer.from(await bannerFile.arrayBuffer());
      const uploaded = await imagekit.upload({
        file: buffer,
        fileName: bannerFile.name || `banner-${Date.now()}`,
        folder: "banners",
      });
      updateData.banner = uploaded.url;
    }

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: updateData,
    });

    return NextResponse.json({ message: "Store profile updated successfully.", store: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
