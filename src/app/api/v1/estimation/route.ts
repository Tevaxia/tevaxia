import { NextResponse } from "next/server";
import { estimer } from "@/lib/estimation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = estimer(body);
    if (!result) {
      return NextResponse.json({ success: false, error: "Commune non trouvée" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Paramètres invalides" }, { status: 400 });
  }
}
