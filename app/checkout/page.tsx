"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { cartItems } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  );

  const deliveryFee = subtotal > 0 ? 1500 : 0;
  const total = subtotal + deliveryFee;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitted(true);
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* Page Header */}
        <div className="mb-12">
          <Link
            href="/cart"
            className="mb-6 flex w-fit items-center gap-2 text-gray-600 
transition hover:text-black"
          >
            <ArrowLeft size={18} />
            Back to cart
          </Link>

          <h1 className="text-4xl font-extrabold md:text-5xl">
            Checkout
          </h1>

          <p className="mt-3 text-gray-600">
            Enter your delivery information to place your order.
          </p>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="rounded-3xl border border-dashed p-12 
text-center">
            <h2 className="text-2xl font-bold">
              Your cart is empty
            </h2>

            <p className="mt-4 text-gray-600">
              Add some delicious meals before checking out.
            </p>

            <Link
              href="/menu"
              className="mt-8 inline-block rounded-xl bg-yellow-400 px-8 
py-4 font-bold transition hover:bg-yellow-500"
            >
              Browse Menu
            </Link>
          </div>
        ) : submitted ? (
          /* Temporary Success Message */
          <div className="mx-auto max-w-2xl rounded-3xl border bg-white 
p-12 text-center shadow-lg">
            <CheckCircle
              size={64}
              className="mx-auto text-green-500"
            />

            <h2 className="mt-6 text-3xl font-extrabold">
              Order Received!
            </h2>

            <p className="mt-4 text-gray-600">
              Thank you, {customerName}. Your order has been
              received successfully.
            </p>

            <p className="mt-2 text-gray-600">
              We will contact you on{" "}
              <strong>{phone}</strong> to confirm your delivery.
            </p>

            <Link
              href="/"
              className="mt-8 inline-block rounded-xl bg-yellow-400 px-8 
py-4 font-bold transition hover:bg-yellow-500"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Customer Information */}
            <div className="lg:col-span-2">
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl border bg-white p-6 shadow-sm 
md:p-8"
              >
                <h2 className="text-2xl font-bold">
                  Delivery Information
                </h2>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="customerName"
                      className="mb-2 block font-semibold"
                    >
                      Full Name
                    </label>

                    <input
                      id="customerName"
                      type="text"
                      value={customerName}
                      onChange={(event) =>
                        setCustomerName(event.target.value)
                      }
                      placeholder="Enter your full name"
                      required
                      className="w-full rounded-xl border border-gray-300 
p-4 outline-none transition focus:border-yellow-400 focus:ring-2 
focus:ring-yellow-100"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block font-semibold"
                    >
                      Phone Number
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                      placeholder="07XXXXXXXX"
                      required
                      className="w-full rounded-xl border border-gray-300 
p-4 outline-none transition focus:border-yellow-400 focus:ring-2 
focus:ring-yellow-100"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label
                      htmlFor="city"
                      className="mb-2 block font-semibold"
                    >
                      City
                    </label>

                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(event) =>
                        setCity(event.target.value)
                      }
                      placeholder="Kigali"
                      required
                      className="w-full rounded-xl border border-gray-300 
p-4 outline-none transition focus:border-yellow-400 focus:ring-2 
focus:ring-yellow-100"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="address"
                      className="mb-2 block font-semibold"
                    >
                      Delivery Address
                    </label>

                    <textarea
                      id="address"
                      value={address}
                      onChange={(event) =>
                        setAddress(event.target.value)
                      }
                      placeholder="Enter your street, house number, or 
location"
                      required
                      rows={4}
                      className="w-full resize-none rounded-xl border 
border-gray-300 p-4 outline-none transition focus:border-yellow-400 
focus:ring-2 focus:ring-yellow-100"
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="notes"
                      className="mb-2 block font-semibold"
                    >
                      Order Notes
                    </label>

                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
                      placeholder="Optional instructions for delivery"
                      rows={3}
                      className="w-full resize-none rounded-xl border 
border-gray-300 p-4 outline-none transition focus:border-yellow-400 
focus:ring-2 focus:ring-yellow-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-8 w-full rounded-xl bg-yellow-400 py-4 
font-bold transition hover:bg-yellow-500"
                >
                  Place Order
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="h-fit rounded-3xl border bg-white p-6 
shadow-sm md:p-8">
              <h2 className="text-2xl font-bold">
                Your Order
              </h2>

              <div className="mt-6 space-y-5">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold">
                        {item.product.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <p className="whitespace-nowrap font-semibold">
                      {(
                        item.product.price * item.quantity
                      ).toLocaleString()}{" "}
                      RWF
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-6 border-t" />

              <div className="space-y-3">
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
              </div>

              <div className="my-6 border-t" />

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">
                  Total
                </span>

                <span className="text-2xl font-extrabold">
                  {total.toLocaleString()} RWF
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
