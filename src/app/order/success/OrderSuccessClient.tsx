"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/contexts/CartContext";

export default function OrderSuccessClient({ orderId }: { orderId: string }) {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-8 w-8 text-green-600"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Order Successful!</h1>
          <p className="text-neutral-600">Ačiū! Jūsų užsakymas gautas ir apdorojamas.</p>

          {orderId ? (
            <p className="text-sm text-neutral-500">
              Order ID: <span className="font-mono">{orderId}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
          <Link href="/">
            <Button className="bg-neutral-200 text-neutral-900 hover:bg-neutral-300">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}