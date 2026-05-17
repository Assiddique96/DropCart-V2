import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import imagekit from "@/configs/imageKit";
import prisma from "src/db";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    // Get the active store for this user
    const store = await prisma.store.findFirst({
      where: { userId },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Check if already verified
    if (store.verificationStatus === "verified") {
      return NextResponse.json({ error: "Store is already verified" }, { status: 400 });
    }

    // Validation
    const cacNumber = sanitizeString(formData.get("cacNumber"), 50);
    const verificationDocumentType = sanitizeString(formData.get("verificationDocumentType"), 20).toUpperCase();
    const verificationDocumentNumber = sanitizeString(formData.get("verificationDocumentNumber"), 100);
    const verificationDocumentImage = formData.get("verificationDocumentImage");
    const facialVerificationImage = formData.get("facialVerificationImage");

    if (!cacNumber) {
      return NextResponse.json({ error: "CAC number is required" }, { status: 400 });
    }

    if (!verificationDocumentNumber) {
      return NextResponse.json({ error: "Document number is required" }, { status: 400 });
    }

    if (!verificationDocumentImage || !(verificationDocumentImage instanceof Blob)) {
      return NextResponse.json({ error: "Valid document image is required" }, { status: 400 });
    }

    if (!facialVerificationImage || !(facialVerificationImage instanceof Blob)) {
      return NextResponse.json({ error: "Valid selfie image is required" }, { status: 400 });
    }

    // Upload images
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

    // Update store with verification details
    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        cacNumber,
        verificationDocumentType,
        verificationDocumentNumber,
        verificationDocumentUrl: docUpload.url,
        facialVerificationUrl: selfieUpload.url,
        verificationStatus: "pending",
      },
    });

    return NextResponse.json({
      message: "Verification submitted successfully. Awaiting admin review.",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Store verification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
