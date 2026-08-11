"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { Product } from "@/types/product";
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
}

const OrderContext = createContext<OrderContextType | undefined>(
  undefined
);

export function OrderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [orders, setOrders] = useState<Order[]>([]);

  function createOrder(
    customer: CustomerInformation,
    delivery: DeliveryInformation,
    items: CartItem[],
    subtotal: number,
    deliveryFee: number
  ) {
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

    setOrders((currentOrders) => [
      ...currentOrders,
      order,
    ]);

    return order;
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
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
