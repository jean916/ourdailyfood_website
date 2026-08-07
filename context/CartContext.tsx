"use client";

import { createContext, useContext, useSyncExternalStore, ReactNode } from "react";
import { Product } from "@/types/product";

export interface CartItem {
  product: Product;
  quantity: number;
}

type Listener = () => void;

let cartItems: CartItem[] = [];
let initialized = false;
const listeners = new Set<Listener>();

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const stored = window.localStorage.getItem("ourdailyfood-cart");
    if (stored) cartItems = JSON.parse(stored);
  } catch {
    cartItems = [];
  }
}

function emit() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("ourdailyfood-cart", JSON.stringify(cartItems));
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  initialize();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  initialize();
  return cartItems;
}

function getServerSnapshot() {
  return [] as CartItem[];
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  increaseQuantity: (id: number) => void;
  decreaseQuantity: (id: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function addToCart(product: Product) {
    const existing = cartItems.find((item) => item.product.id === product.id);
    cartItems = existing
      ? cartItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      : [...cartItems, { product, quantity: 1 }];
    emit();
  }

  function removeFromCart(id: number) {
    cartItems = cartItems.filter((item) => item.product.id !== id);
    emit();
  }

  function increaseQuantity(id: number) {
    cartItems = cartItems.map((item) =>
      item.product.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    emit();
  }

  function decreaseQuantity(id: number) {
    cartItems = cartItems
      .map((item) => item.product.id === id ? { ...item, quantity: item.quantity - 1 } : item)
      .filter((item) => item.quantity > 0);
    emit();
  }

  function clearCart() {
    cartItems = [];
    emit();
  }

  return (
    <CartContext.Provider value={{
      cartItems: items,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}