import { NextResponse } from "next/server";

/** GET /api/wholesale – returns hero promo info for wholesale section */
export async function GET() {
  return NextResponse.json({
    heroPromo: {
      label: "Wholesale",
      desc: "SME-friendly bulk pricing",
      href: "/wholesale",
    },
  });
}
