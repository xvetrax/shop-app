import { NextResponse } from "next/server";
import type { CartItem } from "@/lib/types/cart";
import type { Customer } from "@/lib/types/order";
import { adminDb } from "@/lib/firebaseAdmin";
import { getShippingPriceEUR } from "@/lib/shipping";

type RequestBody = { items: CartItem[]; customer: Customer };

type OmnivaPickupPoint = {
  id: string;
  name: string;
  address: string;
  city?: string;
};

function calcItemsTotal(items: CartItem[]) {
  return items.reduce((sum, i) => {
    const price = Number(i?.product?.price ?? 0);
    const qty = Number(i?.quantity ?? 0);
    return sum + price * qty;
  }, 0);
}

function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

async function fetchOmnivaPickupPoints(): Promise<OmnivaPickupPoint[]> {
  // ⚠️ Naudojam tavo own endpointą (server-to-server)
  // Reikia NEXT_PUBLIC_SITE_URL Vercelyje nustatyti į tavo prod domeną.
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) throw new Error("Missing env: NEXT_PUBLIC_SITE_URL");

  const res = await fetch(`${base}/api/omniva/pickup-points`, {
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Failed to load Omniva pickup points");
  }

  return (data?.points ?? []) as OmnivaPickupPoint[];
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();

    if (!body.items?.length) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    if (!body.customer) {
      return NextResponse.json(
        { success: false, error: "Customer information is required" },
        { status: 400 }
      );
    }

    const requiredFields: (keyof Customer)[] = [
      "name",
      "email",
      "phone",
      "address",
      "city",
      "postalCode",
      "deliveryMethod",
    ];

    for (const field of requiredFields) {
      const v = body.customer?.[field];
      if (v === undefined || v === null || String(v).trim() === "") {
        return NextResponse.json(
          { success: false, error: `${String(field)} is required` },
          { status: 400 }
        );
      }
    }

    // ✅ Omniva: privalomas pickupPointId + snapshot iš API
    let pickupPoint: OmnivaPickupPoint | null = null;

    if (body.customer.deliveryMethod === "omniva") {
      const pickupPointId = body.customer.pickupPointId;
      if (!pickupPointId) {
        return NextResponse.json(
          { success: false, error: "pickupPointId is required for Omniva" },
          { status: 400 }
        );
      }

      const points = await fetchOmnivaPickupPoints();
      const p = points.find((x) => x.id === pickupPointId);

      if (!p) {
        return NextResponse.json(
          { success: false, error: "Invalid Omniva pickup point" },
          { status: 400 }
        );
      }

      pickupPoint = p;
    }

    const itemsTotal = round2(calcItemsTotal(body.items));

    const shipping = round2(
      body.customer.deliveryMethod === "omniva"
        ? getShippingPriceEUR("omniva")
        : 0
    );

    const total = round2(itemsTotal + shipping);

    // ✅ docRef iš anksto, kad turėtume id
    const docRef = adminDb.collection("orders").doc();

    await docRef.set({
      id: docRef.id,
      status: "pending",

      customer: {
        ...body.customer,
        comment: body.customer.comment?.trim() || "",
      },

      pickupPoint, // ✅ snapshot admin/email (null jei ne omniva)

      items: body.items,

      itemsTotal,
      shipping,
      total,

      currency: "EUR",
      paymentProvider: "opay-mock",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const paymentUrl = `/order/mock-opay?orderId=${encodeURIComponent(docRef.id)}`;
    return NextResponse.json({ success: true, paymentUrl, orderId: docRef.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}