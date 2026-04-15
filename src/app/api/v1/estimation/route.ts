import { NextResponse } from "next/server";
import { estimer } from "@/lib/estimation";
import {
  authenticateApiRequest,
  corsPreflightResponse,
  withCors,
  API_CORS_HEADERS,
} from "@/lib/api-auth";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function POST(request: Request) {
  const auth = authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }

  if (!body.commune || !body.surface) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: commune, surface" },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }

  if (typeof body.surface !== "number" || body.surface <= 0 || body.surface > 10000) {
    return NextResponse.json(
      { success: false, error: "surface must be a positive number ≤ 10000" },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }

  try {
    const result = estimer(body);
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Municipality not found" },
        { status: 404, headers: API_CORS_HEADERS },
      );
    }
    const response = NextResponse.json({
      success: true,
      data: result,
      meta: {
        api_key_name: auth.keyRecord.name,
        tier: auth.keyRecord.tier,
        method: "tegova_evs_2025+hedonic",
      },
    });
    return withCors(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Calculation error: ${message}` },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }
}
