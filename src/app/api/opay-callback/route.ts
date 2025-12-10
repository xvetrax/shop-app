import { NextResponse } from "next/server";
import { verifyCallback } from "@/lib/opay";

/**
 * Opay webhook callback handler
 * This endpoint receives payment status updates from Opay
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Extract signature from headers or body (depending on Opay implementation)
    const signature =
      request.headers.get("X-Opay-Signature") ||
      body.signature ||
      body.hash;

    // Verify callback signature
    const isValid = verifyCallback(body, signature || "");

    if (!isValid) {
      console.error("Invalid Opay callback signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Extract payment information
    const orderId = body.orderId || body.order_id;
    const status = body.status || body.paymentStatus;
    const amount = body.amount;

    console.log("Opay callback received:", {
      orderId,
      status,
      amount,
      timestamp: new Date().toISOString(),
    });

    // TODO: Update order status in database
    // For MVP, we'll just log the information
    // In production, you would:
    // 1. Find the order by orderId
    // 2. Update order status based on payment status
    // 3. Send confirmation email if payment successful
    // 4. Update inventory if needed

    // Handle different payment statuses
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
      case "paid":
        // Payment successful
        // TODO: Update order status, send confirmation email, etc.
        console.log(`Order ${orderId} payment completed`);
        break;

      case "failed":
      case "error":
        // Payment failed
        // TODO: Update order status, notify customer, etc.
        console.log(`Order ${orderId} payment failed`);
        break;

      case "cancelled":
        // Payment cancelled
        // TODO: Update order status
        console.log(`Order ${orderId} payment cancelled`);
        break;

      default:
        console.log(`Order ${orderId} payment status: ${status}`);
    }

    // Always return 200 OK to Opay (important!)
    // Opay will retry if we return an error status
    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("Opay callback error:", error);

    // Still return 200 to prevent Opay from retrying
    // Log the error for investigation
    return NextResponse.json(
      { success: false, error: "Callback processing failed" },
      { status: 200 }
    );
  }
}

