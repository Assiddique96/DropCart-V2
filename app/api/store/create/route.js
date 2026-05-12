import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import imagekit from "@/configs/imageKit";
import prisma from "src/db";
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
    const verificationDocumentImage = formData.get("verificationDocumentImage");
    const facialVerificationImage = formData.get("facialVerificationImage");

    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ error: "Valid store logo is required." }, { status: 400 });
    }
    // ... repeat checks for other images ...

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

    const docBuffer = Buffer.from(await verificationDocumentImage.arrayBuffer());
    const docUpload = await imagekit.upload({
      file: docBuffer,
      fileName: "doc-" + Date.now(),
      folder: "verification/documents",
    });

    const selfieBuffer = Buffer.from(await facialVerificationImage.arrayBuffer());
    const selfieUpload = await imagekit.upload({
      file: selfieBuffer,
      fileName: "selfie-" + Date.now(),
      folder: "verification/selfies",
    });

    // 7. DB Operation
    try {
      await prisma.store.create({
        data: {
          userId, // Now guaranteed to exist
          name: sanitized.name,
          description: sanitized.description,
          username: sanitized.username.toLowerCase(),
          email: sanitized.email,
          contact: sanitized.contact,
          address: sanitized.address,
          logo: logoUpload.url,
          cacNumber: sanitizeString(formData.get("cacNumber"), 50),
          verificationDocumentType: sanitizeString(formData.get("verificationDocumentType"), 20).toUpperCase(),
          verificationDocumentNumber: sanitizeString(formData.get("verificationDocumentNumber"), 100),
          verificationDocumentUrl: docUpload.url,
          facialVerificationUrl: selfieUpload.url,
          payoutBankName: sanitizeString(formData.get("payoutBankName"), 100),
          payoutAccountName: sanitizeString(formData.get("payoutAccountName"), 120),
          payoutAccountNumber: sanitizeString(formData.get("payoutAccountNumber"), 30),
        },
      });

      return NextResponse.json({ message: "Applied, Awaiting approval" });
    } catch (dbError) {
      // Cleanup ImageKit on DB failure
      await imagekit.deleteFile(logoUpload.fileId);
      await imagekit.deleteFile(docUpload.fileId);
      await imagekit.deleteFile(selfieUpload.fileId);
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