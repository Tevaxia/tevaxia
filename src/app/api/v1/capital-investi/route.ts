import { NextResponse } from "next/server";
import { calculerCapitalInvesti } from "@/lib/calculations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = calculerCapitalInvesti(body);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Paramètres invalides" }, { status: 400 });
  }
}
