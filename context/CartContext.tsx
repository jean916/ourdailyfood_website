"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  ReactNode,
} from "react";

import { Product } from "@/types/product";

export interface CartItem {
  product: Product;
  quantity: number;
}

type Listener = () => void;

/*
 * The cart is stored outside React state so that it can
 * be shared between components and persisted in localStorage.
 */
let cartItems: CartItem[] = [];
let initialized = false;

const listeners = new Set<Listener>();

/*
 * IMPORTANT:
 * This must be a stable reference.
 *
 * Do NOT use:
 *
 * return [];
 *
 * because that creates a new array every time React
 * asks for the server snapshot.
 */
const EMPTY_CART: CartItem[] = [];

/*
 * Load the cart from localStorage.
 */
function initialize() {
  if (initialized || typeof window === "undefined") {
    return;
  }

  initialized = true;

  try {
    const stored = window.localStorage.getItem("ourdailyfood-cart");

    if (stored) {
      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        cartItems = parsed;
      } else {
        cartItems = [];
      }
    }
  } catch {
    cartItems = [];
  }
}

/*
 * Notify all components that the cart changed.
 */
function emit() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      "ourdailyfood-cart",
      JSON.stringify(cartItems)
    );
  }

  listeners.forEach((listener) => listener());
}

/*
 * Subscribe React components to cart changes.
 */
function subscribe(listener: Listener) {
  initialize();

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/*
 * Get the current cart on the client.
 */
function getSnapshot() {
  initialize();

  return cartItems;
}

/*
 * Get the cart during server rendering.
 *
 * EMPTY_CART is intentionally a constant so React receives
 * the exact same reference every time.
 */
function getServerSnapshot() {
  return EMPTY_CART;
}

interface CartContextType {
  cartItems: CartItem[];

  addToCart: (product: Product) => void;

  removeFromCart: (id: number) => void;

  increaseQuantity: (id: number) => void;

  decreaseQuantity: (id: number) => void;

  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  /*
   * Add a product to the cart.
   */
  function addToCart(product: Product) {
    const existing = cartItems.find(
      (item) => item.product.id === product.id
    );

    if (existing) {
      cartItems = cartItems.map((item) =>
        item.product.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );
    } else {
      cartItems = [
        ...cartItems,
        {
          product,
          quantity: 1,
        },
      ];
    }

    emit();
  }

  /*
   * Remove a product completely.
   */
  function removeFromCart(id: number) {
    cartItems = cartItems.filter(
      (item) => item.product.id !== id
    );

    emit();
  }

  /*
   * Increase product quantity.
   */
  function increaseQuantity(id: number) {
    cartItems = cartItems.map((item) =>
      item.product.id === id
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item
    );

    emit();
  }

  /*
   * Decrease product quantity.
   * Remove the item when quantity reaches zero.
   */
  function decreaseQuantity(id: number) {
    cartItems = cartItems
      .map((item) =>
        item.product.id === id
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item
      )
      .filter((item) => item.quantity > 0);

    emit();
  }

  /*
   * Remove everything from the cart.
   */
  function clearCart() {
    cartItems = [];

    emit();
  }

  return (
    <CartContext.Provider
      value={{
        cartItems: items,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
