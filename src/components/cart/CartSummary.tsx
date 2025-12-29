"use client";

import { useCart } from "@/contexts/CartContext";
import { calculateTotal } from "@/lib/types/cart";

type Props = {
  showShipping?: boolean;
  shippingCost?: number;
};

export function CartSummary({ showShipping = false, shippingCost = 0 }: Props) {
  const { items } = useCart();
  const subtotal = calculateTotal(items);
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return null;
  }

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
              {shippingCost > 0 ? `${shippingCost.toFixed(2)} €` : "Free"}
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



