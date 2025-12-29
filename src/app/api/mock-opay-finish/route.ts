// src/app/api/mock-opay-finish/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendPaidOrderEmail } from "@/lib/email";

type Body = {
  orderId?: string;
  status?: "paid" | "failed";
};

export async function POST(req: Request) {
  try {
    const { orderId, status } = (await req.json()) as Body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId" },
        { status: 400 }
      );
    }

    if (status !== "paid" && status !== "failed") {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const ref = adminDb.collection("orders").doc(orderId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const order = snap.data() as any;

    // 1) update order status
    await ref.update({
      status,
      updatedAt: new Date(),
      ...(status === "paid" ? { paidAt: new Date() } : {}),
    });

    // 2) jei paid – siųsti email (tik 1 kartą)
    if (status === "paid") {
      const alreadySent = Boolean(order?.emailSent?.paidAt);

      if (!alreadySent) {
        const to = order?.customer?.email || order?.customerEmail || null;

        if (to) {
          await sendPaidOrderEmail({
            to,
            orderId, // ✅ SVARBIAUSIA: doc id, ne order.id
            total: Number(order?.total ?? 0),
            currency: order?.currency ?? "EUR",
            items: (order?.items ?? []).map((i: any) => ({
              name: i?.product?.name ?? i?.name ?? "Item",
              qty: Number(i?.quantity ?? i?.qty ?? 1),
              price: Number(i?.product?.price ?? i?.price ?? 0),
            })),
            shipping: {
              name: order?.customer?.name,
              phone: order?.customer?.phone,
              address: order?.customer?.address,
              city: order?.customer?.city,
              postalCode: order?.customer?.postalCode,
              deliveryMethod: order?.customer?.deliveryMethod,
            },
          });

          await ref.update({
            emailSent: {
              ...(order?.emailSent ?? {}),
              paidAt: new Date(),
            },
          });
        } else {
          console.warn("Order paid but no customer email found:", orderId);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Update order error:", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Failed to update order",
      },
      { status: 500 }
    );
  }
}