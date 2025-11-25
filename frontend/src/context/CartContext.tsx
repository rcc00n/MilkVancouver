import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Product } from "../types";

type CartContextValue = {
  items: CartItem[];
  addItem: (p: Product, quantity?: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clear: () => void;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "md_cart";

function decodeCartFromQuery(): CartItem[] | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("cart");
  if (!encoded) return null;
  try {
    const json = atob(encoded);
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      // Clean up the URL so the param doesn't linger in history / sharing.
      params.delete("cart");
      const url = new URL(window.location.href);
      url.search = params.toString();
      window.history.replaceState({}, "", url.toString());
      return parsed;
    }
  } catch (error) {
    console.error("Failed to decode cart from query", error);
  }
  return null;
}

function getInitialCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  // Prefer a cart passed via query string (used when redirecting from an insecure origin).
  const cartFromQuery = decodeCartFromQuery();
  if (cartFromQuery) return cartFromQuery;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(getInitialCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    setItems(prev =>
      prev
        .map(i => i.product.id === id ? { ...i, quantity } : i)
        .filter(i => i.quantity > 0)
    );
  };

  const removeItem = (id: number) =>
    setItems(prev => prev.filter(i => i.product.id !== id));

  const clear = () => setItems([]);

  const subtotalCents = items.reduce(
    (sum, i) => sum + i.product.price_cents * i.quantity, 0
  );

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, subtotalCents }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
