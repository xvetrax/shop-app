"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import type { CartItem as CartItemType } from "@/lib/types/cart";
import { calculateItemTotal } from "@/lib/types/cart";

type Props = {
  item: CartItemType;
};

export function CartItem({ item }: Props) {
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;
  const total = calculateItemTotal(item);

  const handleDecrease = () => {
    updateQuantity(product.slug, quantity - 1);
  };

  const handleIncrease = () => {
    updateQuantity(product.slug, quantity + 1);
  };

  const handleRemove = () => {
    removeItem(product.slug);
  };

  return (
    <div className="flex gap-4 border-b border-neutral-200 pb-6 last:border-0 last:pb-0">
      <Link
        href={`/products/${product.slug}`}
        className="relative flex-shrink-0 overflow-hidden rounded-lg bg-sand-100 aspect-square w-24 h-24"
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
        />
      </Link>

      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={`/products/${product.slug}`}
              className="text-sm font-medium hover:text-cocoa-700 transition-colors"
            >
              {product.name}
            </Link>
            <p className="text-xs text-neutral-500">{product.category}</p>
          </div>
          <button
            onClick={handleRemove}
            className="text-neutral-400 hover:text-neutral-900 transition-colors"
            aria-label="Remove item"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrease}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="Decrease quantity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={handleIncrease}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="Increase quantity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm font-semibold">{total.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  );
}



