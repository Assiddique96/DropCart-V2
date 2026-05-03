import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import imagekit from "@/configs/imageKit";
import prisma from "src/db";

import { sanitizeStoreInput } from "@/lib/sanitize";
import { sanitizeString } from "@/lib/sanitize";

// Creating Store
export async function POST(request) {
  // Rate limit: max 5 store creation attempts per minute per IP
  const limit = strictLimiter.check(request);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }
  try {
    const { userId } = getAuth(request);
    const formData = await request.formData();

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

    const { name, username, description, email, contact, address } = sanitized;
    const image = formData.get("image");

    // Verification fields
    const cacNumber = sanitizeString(formData.get("cacNumber"), 50);
    const verificationDocumentType = sanitizeString(formData.get("verificationDocumentType"), 20).toUpperCase();
    const verificationDocumentNumber = sanitizeString(formData.get("verificationDocumentNumber"), 100);
    const verificationDocumentImage = formData.get("verificationDocumentImage");
    const facialVerificationImage = formData.get("facialVerificationImage");

    // Payout fields
    const payoutBankName = sanitizeString(formData.get("payoutBankName"), 100);
    const payoutAccountName = sanitizeString(formData.get("payoutAccountName"), 120);
    const payoutAccountNumber = sanitizeString(formData.get("payoutAccountNumber"), 30);

    if (!image) {
      return NextResponse.json({ error: "Store logo image is required." }, { status: 400 });
    }

    if (!cacNumber) {
      return NextResponse.json({ error: "CAC registration number is required." }, { status: 400 });
    }

    if (!["NIN", "PASSPORT"].includes(verificationDocumentType)) {
      return NextResponse.json({ error: "Verification document type must be NIN or PASSPORT." }, { status: 400 });
    }

    if (!verificationDocumentNumber) {
      return NextResponse.json({ error: "Verification document number is required." }, { status: 400 });
    }

    if (!(verificationDocumentImage instanceof File) || verificationDocumentImage.size === 0) {
      return NextResponse.json({ error: "Verification document photo is required." }, { status: 400 });
    }

    if (!(facialVerificationImage instanceof File) || facialVerificationImage.size === 0) {
      return NextResponse.json({ error: "Facial verification photo (selfie) is required." }, { status: 400 });
    }

    if (!payoutBankName || !payoutAccountName || !payoutAccountNumber) {
      return NextResponse.json({ error: "Bank details (bank name, account name, account number) are required for payouts." }, { status: 400 });
    }

    // 1. Check if username is taken
    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: username.toLowerCase() },
    });

    if (isUsernameTaken) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // 2. Upload images to ImageKit
    const logoBuffer = Buffer.from(await image.arrayBuffer());
    const logoUpload = await imagekit.upload({
      file: logoBuffer,
      fileName: image.name,
      folder: "logos",
    });

    const docBuffer = Buffer.from(await verificationDocumentImage.arrayBuffer());
    const docUpload = await imagekit.upload({
      file: docBuffer,
      fileName: verificationDocumentImage.name || `doc-${Date.now()}`,
      folder: "verification/documents",
    });

    const selfieBuffer = Buffer.from(await facialVerificationImage.arrayBuffer());
    const selfieUpload = await imagekit.upload({
      file: selfieBuffer,
      fileName: facialVerificationImage.name || `selfie-${Date.now()}`,
      folder: "verification/selfies",
    });

    // 3. Wrap DB operations in a sub-try/catch for cleanup
    try {
      const newStore = await prisma.store.create({
        data: {
          userId,
          name,
          description,
          username: username.toLowerCase(),
          email,
          contact,
          address,
          logo: logoUpload.url,

          cacNumber,
          verificationDocumentType,
          verificationDocumentNumber,
          verificationDocumentUrl: docUpload.url,
          facialVerificationUrl: selfieUpload.url,

          payoutBankName,
          payoutAccountName,
          payoutAccountNumber,
        },
      });

      return NextResponse.json({ message: "Applied, Awaiting approval" });

    } catch (dbError) {
      // If DB fails, delete the image we just uploaded
      await imagekit.deleteFile(logoUpload.fileId);
      await imagekit.deleteFile(docUpload.fileId);
      await imagekit.deleteFile(selfieUpload.fileId);
      throw dbError; // Pass it to the outer catch
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message || "Internal Server Error" },
      { status: 400 }
    );
  }
} // <--- This closes the POST function

// check is user have already registered a store if yes then send status of stor

export async function GET(request) {
    try {
        const {userId} = getAuth(request)

        // check is user have already registered a store
        const store = await prisma.store.findFirst({
            where: { userId: userId}
            , orderBy: { createdAt: "desc" }
        })

// if store is already registered then send status of store
        if(store){
            return NextResponse. json({status: store.status})
        }

        return NextResponse.json({status: "Not Registered"})

    } catch (error) {
        console.error(error);
        return NextResponse.json(
        { error: error.code || error.message || "Internal Server Error" },
        { status: 400 }
        );
    }
}
