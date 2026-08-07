"use client";

import Link from "next/link";
import { ShoppingCart, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

export default function Navbar() {
  const { cartItems } = useCart();
  const [open, setOpen] = useState(false);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-black text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-extrabold text-yellow-400 sm:text-3xl">
          OurDailyFood
        </Link>

        <nav className="hidden gap-8 md:flex">
          <Link href="/" className="hover:text-yellow-400">Home</Link>
          <Link href="/menu" className="hover:text-yellow-400">Menu</Link>
          <Link href="/about" className="hover:text-yellow-400">About</Link>
          <Link href="/contact" className="hover:text-yellow-400">Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="relative rounded-lg bg-yellow-400 p-2 text-black hover:bg-yellow-500">
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={28} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-gray-800 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/" onClick={() => setOpen(false)}>Home</Link>
            <Link href="/menu" onClick={() => setOpen(false)}>Menu</Link>
            <Link href="/about" onClick={() => setOpen(false)}>About</Link>
            <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
          </div>
        </nav>
      )}
    </header>
  );
}