"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/lib/types/cart";
import type { Product } from "@/lib/products";

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productSlug: string) => void;
  updateQuantity: (productSlug: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productSlug: string) => number;
  getTotalItems: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "revital-cart";

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("Failed to load cart from localStorage:", error);
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save cart to localStorage:", error);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadedItems = loadCartFromStorage();
    setItems(loadedItems);
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveCartToStorage(items);
    }
  }, [items, isHydrated]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.slug === product.slug
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.slug === product.slug
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prevItems,
        {
          product,
          quantity,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productSlug: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.product.slug !== productSlug)
    );
  }, []);

  const updateQuantity = useCallback((productSlug: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productSlug);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.slug === productSlug
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (productSlug: string): number => {
      const item = items.find((item) => item.product.slug === productSlug);
      return item?.quantity ?? 0;
    },
    [items]
  );

  const getTotalItems = useCallback((): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}



