"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-center space-y-6 py-20 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-16 w-16 text-neutral-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.34 1.087.85l1.31 6.744c.07.35-.127.7-.456.9l-1.434.81c-.33.19-.733.19-1.064 0l-1.434-.81c-.329-.2-.526-.55-.456-.9l1.31-6.744c.132-.51.576-.85 1.087-.85H2.25zM15.75 3h-1.386c-.51 0-.955.34-1.087.85l-1.31 6.744c-.07.35.127.7.456.9l1.434.81c.33.19.733.19 1.064 0l1.434-.81c.329-.2.526-.55.456-.9l-1.31-6.744c-.132-.51-.576-.85-1.087-.85H15.75z"
            />
          </svg>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Your cart is empty</h1>
            <p className="text-neutral-600">
              Add some products to your cart to continue shopping.
            </p>
          </div>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Shopping Cart</h1>
      
      <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
        <div className="space-y-6">
          {items.map((item) => (
            <CartItem key={item.product.slug} item={item} />
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <CartSummary />
          <Link href="/checkout" className="mt-4 block">
            <Button className="w-full">Proceed to Checkout</Button>
          </Link>
          <Link
            href="/products"
            className="mt-4 block text-center text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Continue Shopping →
          </Link>
        </div>
      </div>
    </div>
  );
}



