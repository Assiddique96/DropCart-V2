import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import imagekit from "@/configs/imageKit";
import prisma from "src/db";
import { inngest } from "@/inngest/client";
import { sanitizeStoreInput, sanitizeString } from "@/lib/sanitize";

// Ensure this is imported or defined!
// import { strictLimiter } from "@/lib/limiter"; 

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the user's stores to check status
    const stores = await prisma.store.findMany({
      where: { userId },
      select: { status: true },
    });

    // If no stores, return undefined status
    if (stores.length === 0) {
      return NextResponse.json({ status: undefined });
    }

    // Return the first store's status (or you could return latest)
    return NextResponse.json({ status: stores[0].status });
  } catch (error) {
    console.error("GET /api/store/create ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // 1. Auth Guard: Crucial for your Prisma model
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate Limit Guard
    if (typeof strictLimiter !== "undefined") {
      const limit = strictLimiter.check(request);
      if (!limit.allowed) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    }

    const formData = await request.formData();

    // 3. Validation Logic
    const { data: sanitized, errors } = sanitizeStoreInput({
      name: formData.get("name"),
      username: formData.get("username"),
      description: formData.get("description"),
      email: formData.get("email"),
      contact: formData.get("contact"),
      address: formData.get("address"),
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    // 4. File Existence Checks (Prevents .arrayBuffer() crashes)
    const image = formData.get("image");

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ error: "Valid store logo is required." }, { status: 400 });
    }

    // 5. Check if username is taken
    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: sanitized.username.toLowerCase() },
    });

    if (isUsernameTaken) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // 6. Uploads
    const logoBuffer = Buffer.from(await image.arrayBuffer());
    const logoUpload = await imagekit.upload({
      file: logoBuffer,
      fileName: image.name || "logo",
      folder: "logos",
    });

    // 7. DB Operation
    try {
      const createdStore = await prisma.store.create({
        data: {
          userId, // Now guaranteed to exist
          name: sanitized.name,
          description: sanitized.description,
          username: sanitized.username.toLowerCase(),
          email: sanitized.email,
          contact: sanitized.contact,
          address: sanitized.address,
          logo: logoUpload.url,
          verificationStatus: "unverified", // Default to unverified
        },
      });

      try {
        await inngest.send({
          name: "app/store.created",
          data: {
            storeId: createdStore.id,
            storeName: createdStore.name,
            storeEmail: createdStore.email,
            storeUsername: createdStore.username,
            status: createdStore.status,
          },
        });
      } catch (eventError) {
        console.error("Inngest app/store.created error:", eventError);
      }

      return NextResponse.json({ message: "Store created successfully" });
    } catch (dbError) {
      // Cleanup ImageKit on DB failure
      await imagekit.deleteFile(logoUpload.fileId);
      throw dbError;
    }
  } catch (error) {
    console.error("FULL_ERROR_LOG:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}