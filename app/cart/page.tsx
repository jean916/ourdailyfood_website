"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import CartItem from "@/components/cart/CartItem";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { cartItems, clearCart } = useCart();

  const subtotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="mb-10 text-4xl font-extrabold">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="mt-3 text-gray-600">Add some delicious meals from our menu.</p>
            <Link
              href="/menu"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-500"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {cartItems.map((item) => (
                <CartItem key={item.product.id} product={item.product} quantity={item.quantity} />
              ))}
            </div>

            <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Order Summary</h2>
              <div className="mt-6 flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{subtotal.toLocaleString()} RWF</span>
              </div>
              <div className="mt-3 flex justify-between text-gray-600">
                <span>Delivery</span>
                <span>Free</span>
              </div>
              <div className="my-6 border-t" />
              <div className="flex justify-between text-xl font-extrabold">
                <span>Total</span>
                <span>{subtotal.toLocaleString()} RWF</span>
              </div>
              <button className="mt-6 w-full rounded-xl bg-yellow-400 py-4 font-bold hover:bg-yellow-500">
                Checkout
              </button>
              <button
                onClick={clearCart}
                className="mt-3 w-full rounded-xl border border-red-200 py-3 font-semibold text-red-600 hover:bg-red-50"
              >
                Clear Cart
              </button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}