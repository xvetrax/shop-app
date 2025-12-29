import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { orderId, status } = (await req.json()) as {
      orderId?: string;
      status?: "paid" | "failed";
    };

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

    await adminDb.collection("orders").doc(orderId).update({
      status,
      updatedAt: new Date(),
    });

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