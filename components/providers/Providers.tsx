"use client";

import { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { MenuProvider } from "@/context/MenuContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MenuProvider>
      <CartProvider>{children}</CartProvider>
    </MenuProvider>
  );
}