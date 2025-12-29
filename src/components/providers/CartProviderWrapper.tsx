"use client";

import { CartProvider } from "@/contexts/CartContext";

export function CartProviderWrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}



