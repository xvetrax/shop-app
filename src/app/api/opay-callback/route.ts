// import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db";
import { NextResponse } from "next/server";

// ✅ MOCK callback (iš mock-opay puslapio)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const status = (url.searchParams.get("status") || "").toLowerCase(); // paid | failed

  if (!orderId) {
    return NextResponse.redirect(new URL("/order/failure?reason=missing_orderId", request.url));
  }

  const mapped =
    status === "paid" ? "paid" :
    status === "failed" ? "failed" :
    "failed";

  await updateOrderStatus(orderId, mapped as any);

  const redirectTo =
    mapped === "paid"
      ? `/order/success?orderId=${encodeURIComponent(orderId)}`
      : `/order/failure?orderId=${encodeURIComponent(orderId)}`;

  return NextResponse.redirect(new URL(redirectTo, request.url));
}

/**
 * (Paliekam ateičiai) REAL Opay webhook callback handler (POST)
 * Kai jungsi tikrą Opay – šitas bus naudojamas.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: verify signature real Opay
    const orderId = body.orderId || body.order_id;
    const status = (body.status || body.paymentStatus || "").toLowerCase();

    if (!orderId) return NextResponse.json({ success: true });

    const mapped =
      ["completed", "success", "paid"].includes(status) ? "paid" :
      ["failed", "error", "cancelled"].includes(status) ? "failed" :
      "failed";

    await updateOrderStatus(orderId, mapped as any);

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("Opay callback error:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}