import { NextResponse } from "next/server";
import { createPaymentSession } from "@/lib/opay";
import type { CartItem } from "@/lib/types/cart";
import type { Customer } from "@/lib/types/order";

type RequestBody = {
  items: CartItem[];
  customer: Customer;
};

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();

    // Validate request body
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
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

    // Validate customer fields
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
      if (!body.customer[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create payment session with Opay
    const { redirectUrl, orderId } = await createPaymentSession({
      items: body.items,
      customer: body.customer,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: redirectUrl,
      orderId,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process checkout",
      },
      { status: 500 }
    );
  }
}

