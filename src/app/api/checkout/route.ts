import { NextResponse } from "next/server";
import type { CartItem } from "@/lib/types/cart";
import type { Customer } from "@/lib/types/order";
import { adminDb } from "@/lib/firebaseAdmin";

type RequestBody = { items: CartItem[]; customer: Customer };

function calcTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();

    if (!body.items?.length) {
      return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
    }
    if (!body.customer) {
      return NextResponse.json({ success: false, error: "Customer information is required" }, { status: 400 });
    }

    const requiredFields: (keyof Customer)[] = [
      "name","email","phone","address","city","postalCode","deliveryMethod",
    ];
    for (const field of requiredFields) {
      if (!body.customer?.[field]) {
        return NextResponse.json({ success: false, error: `${String(field)} is required` }, { status: 400 });
      }
    }

    const total = calcTotal(body.items);

    const docRef = await adminDb.collection("orders").add({
      status: "pending",
      customer: body.customer,
      items: body.items,
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