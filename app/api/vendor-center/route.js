import { NextResponse } from "next/server";

/** GET /api/vendor-center – returns hero promo info for vendor center */
export async function GET() {
  return NextResponse.json({
    heroPromo: {
      label: "Vendor Center",
      desc: "Sell on Shpinx",
      href: "/create-store",
    },
  });
}
