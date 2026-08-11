"use client";

import { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { MenuProvider } from "@/context/MenuContext";
import { OrderProvider } from "@/context/OrderContext";

export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OrderProvider>
      <MenuProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </MenuProvider>
    </OrderProvider>
  );
}
