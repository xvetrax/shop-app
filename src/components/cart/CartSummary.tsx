"use client";

import { useCart } from "@/contexts/CartContext";
import { calculateTotal } from "@/lib/types/cart";
import type { DeliveryMethod } from "@/lib/types/order";
import { getShippingPriceEUR } from "@/lib/shipping";

type Props = {
  showShipping?: boolean;

  /**
   * Jei paduosi deliveryMethod — shipping bus skaičiuojamas automatiškai per getShippingPriceEUR().
   * Jei paduosi shippingCost — jis override’ins (pvz. akcijos, nemokamas siuntimas ir pan.)
   */
  deliveryMethod?: DeliveryMethod;
  shippingCost?: number;
};

export function CartSummary({
  showShipping = false,
  deliveryMethod,
  shippingCost,
}: Props) {
  const { items } = useCart();
  const subtotal = calculateTotal(items);

  const computedShipping =
    typeof shippingCost === "number"
      ? shippingCost
      : deliveryMethod
      ? getShippingPriceEUR(deliveryMethod)
      : 0;

  const total = subtotal + (showShipping ? computedShipping : 0);

  if (items.length === 0) return null;

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Order Summary</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">Subtotal</span>
          <span className="font-medium">{subtotal.toFixed(2)} €</span>
        </div>

        {showShipping && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Shipping</span>
            <span className="font-medium">
              {computedShipping > 0 ? `${computedShipping.toFixed(2)} €` : "Free"}
            </span>
          </div>
        )}

        <div className="border-t border-neutral-200 pt-2">
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-semibold">{total.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </div>
  );
}