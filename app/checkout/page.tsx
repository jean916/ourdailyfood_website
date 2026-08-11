"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { createOrder } = useOrders();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  );

  const deliveryFee = cartItems.length > 0 ? 1500 : 0;
  const total = subtotal + deliveryFee;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const customer = {
      firstName: String(formData.get("firstName") || ""),
      lastName: String(formData.get("lastName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
    };

    const delivery = {
      address: String(formData.get("address") || ""),
      city: String(formData.get("city") || ""),
      district: String(formData.get("district") || ""),
      notes: String(formData.get("notes") || ""),
    };

    const order = createOrder(
      customer,
      delivery,
      cartItems,
      subtotal,
      deliveryFee
    );

    setOrderNumber(order.id);
    setIsSubmitting(false);
    setOrderPlaced(true);

    clearCart();
  }

  if (orderPlaced) {
    return (
      <>
        <Navbar />

        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="rounded-3xl border bg-white p-10 shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
              ✓
            </div>

            <h1 className="mt-6 text-4xl font-extrabold">
              Order Placed Successfully!
            </h1>

            <p className="mt-4 text-lg text-gray-600">
              Thank you for ordering from OurDailyFood.
            </p>

            <div className="mt-6 rounded-2xl bg-yellow-50 p-5">
              <p className="text-sm font-medium text-gray-600">
                Your Order Number
              </p>

              <p className="mt-2 text-2xl font-extrabold">
                {orderNumber}
              </p>
            </div>

            <p className="mt-6 text-gray-500">
              Your delicious meal is being prepared.
            </p>

            <Link
              href="/menu"
              className="mt-8 inline-block rounded-xl bg-yellow-400 px-8 py-4 font-bold transition hover:bg-yellow-500"
            >
              Continue Shopping
            </Link>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />

        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold">
            Your cart is empty
          </h1>

          <p className="mt-4 text-gray-600">
            Add some delicious meals before checking out.
          </p>

          <Link
            href="/menu"
            className="mt-8 inline-block rounded-xl bg-yellow-400 px-8 py-4 font-bold transition hover:bg-yellow-500"
          >
            Browse Menu
          </Link>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="mb-12 text-5xl font-extrabold">
          Checkout
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid gap-12 lg:grid-cols-3"
        >
          <section className="lg:col-span-2">
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold">
                Customer Information
              </h2>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    First Name
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    required
                    className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    required
                    className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="+250 7XX XXX XXX"
                    required
                    className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </div>
              </div>

              <h2 className="mt-10 text-2xl font-bold">
                Delivery Information
              </h2>

              <div className="mt-8 space-y-6">
                <div>
                  <label className="mb-2 block font-medium">
                    Address
                  </label>

                  <input
                    type="text"
                    name="address"
                    placeholder="Street / house address"
                    required
                    className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-medium">
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      placeholder="Kigali"
                      required
                      className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      District
                    </label>

                    <input
                      type="text"
                      name="district"
                      placeholder="Gasabo"
                      required
                      className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Delivery Notes
                  </label>

                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Any instructions for the delivery?"
                    className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />
                </div>
              </div>
            </div>
          </section>

          <aside>
            <div className="sticky top-24 rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold">
                Order Summary
              </h2>

              <div className="mt-6 space-y-5">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {item.product.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="font-semibold">
                      {(
                        item.product.price * item.quantity
                      ).toLocaleString()}{" "}
                      RWF
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-6 border-t" />

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    {subtotal.toLocaleString()} RWF
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Delivery
                  </span>

                  <span className="font-semibold">
                    {deliveryFee.toLocaleString()} RWF
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-extrabold">
                    <span>Total</span>

                    <span>
                      {total.toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-8 w-full rounded-xl bg-yellow-400 py-4 font-bold transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Processing Order..."
                  : "Place Order"}
              </button>

              <Link
                href="/cart"
                className="mt-4 block text-center font-medium text-gray-600 hover:text-black"
              >
                ← Back to Cart
              </Link>
            </div>
          </aside>
        </form>
      </main>

      <Footer />
    </>
  );
}