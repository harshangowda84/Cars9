"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  brand: string;
  subbrand: string;
  category: string;
  imageUrl?: string;
  quantity: number;
  warrantyMonths?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number, openDrawer?: boolean) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  generateShareableLink: () => string;
  loadItemsFromData: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cars9_cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("cars9_cart", JSON.stringify(items));
    }
  }, [items, mounted]);

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity = 1, openDrawer = false) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
    if (openDrawer) {
      setIsCartDrawerOpen(true);
    }
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const loadItemsFromData = (newItems: CartItem[]) => {
    setItems(newItems);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const generateShareableLink = () => {
    if (typeof window === "undefined" || items.length === 0) return "";
    const compact = items.map((i) => ({
      id: i.id,
      n: i.name,
      q: i.quantity,
      b: i.brand,
      m: i.subbrand,
      s: i.sku,
      img: i.imageUrl || "",
    }));
    const encoded = encodeURIComponent(btoa(JSON.stringify(compact)));
    return `${window.location.origin}/quotation?share=${encoded}`;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        generateShareableLink,
        loadItemsFromData,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
