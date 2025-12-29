import type { Product } from "@/lib/products";

export type CartItem = {
  product: Product;
  quantity: number;
  selectedColor?: string;
  note?: string;
};

export type CartState = {
  items: CartItem[];
};

export function calculateItemTotal(item: CartItem): number {
  return item.product.price * item.quantity;
}

export function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + calculateItemTotal(item), 0);
}



