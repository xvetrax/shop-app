import type { Customer } from "./types/order";
import type { CartItem } from "./types/cart";
import { calculateTotal } from "./types/cart";
import crypto from "crypto";

type CreatePaymentSessionParams = {
  items: CartItem[];
  customer: Customer;
};

type CreatePaymentSessionResponse = {
  redirectUrl: string;
  orderId: string;
};

/**
 * Formats amount for Opay API
 * Opay expects amount in cents (integer)
 */
export function formatAmountForOpay(amount: number): number {
  // Convert to cents (multiply by 100 and round)
  return Math.round(amount * 100);
}

/**
 * Creates a payment session with Opay
 * Based on Opay API v1 documentation: https://opay.dev/docs/v1#tag/Payments/operation/CreatePayment
 */
export async function createPaymentSession(
  params: CreatePaymentSessionParams
): Promise<CreatePaymentSessionResponse> {
  const merchantId = process.env.OPAY_MERCHANT_ID;
  const apiKey = process.env.OPAY_API_KEY;
  const apiUrl = process.env.OPAY_API_URL || "https://api.opay.lt";
  const successUrl = process.env.OPAY_SUCCESS_URL || `${process.env.NEXT_PUBLIC_APP_URL}/order/success`;
  const failureUrl = process.env.OPAY_FAILURE_URL || `${process.env.NEXT_PUBLIC_APP_URL}/order/failure`;
  const callbackUrl = process.env.OPAY_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/opay-callback`;

  if (!merchantId || !apiKey) {
    throw new Error("Opay credentials not configured. Please set OPAY_MERCHANT_ID and OPAY_API_KEY in .env.local");
  }

  const total = calculateTotal(params.items);
  const amount = formatAmountForOpay(total);

  // Generate unique order ID (must be unique per merchant)
  const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  // Prepare request body according to Opay API v1 specification
  // Reference: https://opay.dev/docs/v1#tag/Payments/operation/CreatePayment
  const requestBody = {
    merchant_id: merchantId,
    order_id: orderId,
    amount: amount, // Amount in cents
    currency: "EUR",
    description: `Order ${orderId} - ${params.items.length} item(s)`,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      phone: params.customer.phone,
    },
    return_url: successUrl,
    cancel_url: failureUrl,
    callback_url: callbackUrl,
    // Additional fields that may be required by Opay API
    language: "lt", // Lithuanian
    country: "LT",
  };

  // Generate signature for request (if required by Opay API)
  // This may need to be adjusted based on actual Opay API requirements
  const signature = generateSignature(requestBody, apiKey);

  try {
    // Opay API endpoint - adjust if different in documentation
    const endpoint = `${apiUrl}/api/v1/payments`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`, // Or may be "X-API-Key" header
        // Some APIs use: "X-API-Key": apiKey
        // Check Opay documentation for exact header format
        "X-Signature": signature, // If signature is required in header
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `Opay API error: ${response.status}`;
      console.error("Opay API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Opay API may return payment_url, redirect_url, or paymentUrl
    // Adjust based on actual API response structure
    const redirectUrl = data.payment_url || data.redirect_url || data.paymentUrl || data.url;
    
    if (!redirectUrl) {
      throw new Error("No payment URL received from Opay API");
    }

    return {
      redirectUrl,
      orderId,
    };
  } catch (error) {
    console.error("Opay payment session creation failed:", error);
    throw error;
  }
}

/**
 * Generates signature for Opay API request
 * Implementation depends on Opay API specification
 * Common methods: HMAC-SHA256, SHA256 hash, etc.
 */
function generateSignature(data: Record<string, unknown>, apiKey: string): string {
  // TODO: Implement according to Opay API documentation
  // Common pattern: HMAC-SHA256 of sorted key-value pairs
  // Example:
  // const sortedKeys = Object.keys(data).sort();
  // const message = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
  // return crypto.createHmac('sha256', apiKey).update(message).digest('hex');
  
  // For now, return empty string if signature not required
  // Or implement basic hash if needed
  const message = JSON.stringify(data);
  return crypto.createHmac('sha256', apiKey).update(message).digest('hex');
}

/**
 * Verifies Opay callback signature
 * Based on Opay webhook/callback signature verification
 * Reference: https://opay.dev/docs/v1 (webhook documentation)
 */
export function verifyCallback(
  payload: Record<string, unknown>,
  signature: string
): boolean {
  const apiKey = process.env.OPAY_API_KEY;
  
  if (!apiKey) {
    console.warn("OPAY_API_KEY not set, skipping signature verification");
    return false; // Fail secure - don't accept callbacks without verification
  }

  if (!signature) {
    console.warn("No signature provided in callback");
    return false;
  }

  try {
    // Opay typically sends signature in header or payload
    // Implementation depends on Opay API specification
    // Common pattern: HMAC-SHA256 of payload
    
    // Remove signature from payload if it's included
    const { signature: payloadSig, ...payloadWithoutSig } = payload;
    const dataToVerify = payloadSig ? payloadWithoutSig : payload;
    
    // Generate expected signature
    // This should match the method used in generateSignature()
    const message = JSON.stringify(dataToVerify);
    const expectedSignature = crypto
      .createHmac('sha256', apiKey)
      .update(message)
      .digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    // Convert hex strings to buffers for comparison
    const receivedBuffer = new Uint8Array(Buffer.from(signature, 'hex'));
    const expectedBuffer = new Uint8Array(Buffer.from(expectedSignature, 'hex'));
    
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    // Use timingSafeEqual with Uint8Array
    const isValid = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

    if (!isValid) {
      console.error("Invalid Opay callback signature", {
        received: signature.substring(0, 10) + "...",
        expected: expectedSignature.substring(0, 10) + "...",
      });
    }

    return isValid;
  } catch (error) {
    console.error("Error verifying Opay callback signature:", error);
    return false;
  }
}

