
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { CartItem } from "@/context/CartContext";

export interface Order {
  id: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  delivery: {
    address: string;
    city: string;
    district: string;
    notes: string;
  };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status:
    | "Pending"
    | "Confirmed"
    | "Preparing"
    | "Out for Delivery"
    | "Delivered"
    | "Cancelled";
  createdAt: string;
}

interface CustomerInformation {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface DeliveryInformation {
  address: string;
  city: string;
  district: string;
  notes: string;
}

interface OrderContextType {
  orders: Order[];
  createOrder: (
    customer: CustomerInformation,
    delivery: DeliveryInformation,
    items: CartItem[],
    subtotal: number,
    deliveryFee: number
  ) => Order;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"]
  ) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(
  undefined
);

const STORAGE_KEY = "ourdailyfood-orders";

export function OrderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Load saved orders once when the provider starts.
  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem(STORAGE_KEY);

      if (savedOrders) {
        const parsedOrders: unknown = JSON.parse(savedOrders);

        if (Array.isArray(parsedOrders)) {
          setOrders(parsedOrders as Order[]);
        }
      }
    } catch (error) {
      console.error("Failed to load saved orders:", error);
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  // Save only after the initial load has finished.
  useEffect(() => {
    if (!storageLoaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error("Failed to save orders:", error);
    }
  }, [orders, storageLoaded]);

  function createOrder(
    customer: CustomerInformation,
    delivery: DeliveryInformation,
    items: CartItem[],
    subtotal: number,
    deliveryFee: number
  ): Order {
    const total = subtotal + deliveryFee;

    const order: Order = {
      id: `ODF-${Date.now()}`,
      customer,
      delivery,
      items,
      subtotal,
      deliveryFee,
      total,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    setOrders((currentOrders) => [...currentOrders, order]);

    return order;
  }

  function updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      "useOrders must be used inside OrderProvider"
    );
  }

  return context;
}
