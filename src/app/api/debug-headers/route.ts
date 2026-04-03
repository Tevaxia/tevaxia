import { headers } from "next/headers";
import { NextResponse } from "next/server";

/** Temporary diagnostic — delete after debugging energy subdomain */
export async function GET() {
  const h = await headers();
  return NextResponse.json({
    host: h.get("host"),
    "x-forwarded-host": h.get("x-forwarded-host"),
    "x-url": h.get("x-url"),
    "x-energy-subdomain": h.get("x-energy-subdomain"),
    "x-vercel-deployment-url": h.get("x-vercel-deployment-url"),
    "x-forwarded-proto": h.get("x-forwarded-proto"),
  });
}
