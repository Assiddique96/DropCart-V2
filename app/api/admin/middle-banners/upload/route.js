import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import imagekit from "@/configs/imageKit";
import authAdmin from "@/middlewares/authAdmin";
import { defaultLimiter } from "@/lib/rateLimit";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request) {
  const limit = defaultLimiter.check(request);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });
    }
    const type = file.type || "";
    if (!ALLOWED.has(type)) {
      return NextResponse.json({ error: "Use JPEG, PNG, WebP, or GIF." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = (file.name || "banner").replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 120);
    const url = imagekit.url({
      path: uploaded.filePath,
      transformation: [{ quality: "auto" }, { format: "webp" }, { width: "1200" }],
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[admin middle-banners upload]", error);
    return NextResponse.json({ error: error.message || "Upload failed." }, { status: 500 });
  }
}
