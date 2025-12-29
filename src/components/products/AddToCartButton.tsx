"use client";

import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/lib/products";
import { Button } from "@/components/ui/Button";

type Props = {
  product: Product;
  quantity?: number;
  className?: string;
};

export function AddToCartButton({ product, quantity = 1, className = "" }: Props) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  return (
    <Button onClick={handleAddToCart} className={className}>
      Add to cart
    </Button>
  );
}



