"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import PayBox from "@/components/orders/PayBox";
import FeedbackBox from "@/components/orders/FeedbackBox";
import { supabase } from "@/lib/supabase";
import {
  ORDER_COLUMNS,
  OrderRow,
  TRACK_STEPS,
  money,
  paymentClasses,
  paymentLabel,
  shortId,
  statusClasses,
} from "@/lib/orders";

interface FeedbackRow {
  order_id: string;
  rating: number;
  comment: string | null;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [feedback, setFeedback] = useState<Record<string, FeedbackRow>>({});
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setSignedIn(false);
      return;
    }

    setSignedIn(true);

    const { data, error: loadError } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("customer_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError("We couldn't load your orders. Please try again.");
      return;
    }

    setError("");
    const rows = (data ?? []) as unknown as OrderRow[];
    setOrders(rows);

    const delivered = rows.filter((o) => o.status === "Delivered").map((o) => String(o.id));

    if (delivered.length > 0) {
      const { data: fb } = await supabase
        .from("feedback")
        .select("order_id, rating, comment")
        .in("order_id", delivered);

      const map: Record<string, FeedbackRow> = {};
      ((fb ?? []) as FeedbackRow[]).forEach((row) => {
        map[row.order_id] = row;
      });
      setFeedback(map);
    }
  }, []);

  useEffect(() => {
    // Refresh automatically so customers see new statuses without reloading.
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 15000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-extrabold">My Orders</h1>
        <p className="mt-2 text-gray-600">
          Track your orders. Status updates appear automatically every few seconds.
        </p>

        {signedIn === false && (
          <div className="mt-10 rounded-2xl border bg-white p-10 text-center">
            <p className="text-lg font-semibold">Please sign in to see your orders.</p>
            <Link
              href="/login?next=/my-orders"
              className="mt-5 inline-block rounded-xl bg-yellow-400 px-8 py-3 font-bold hover:bg-yellow-500"
            >
              Sign in
            </Link>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {signedIn && orders.length === 0 && !error && (
          <div className="mt-10 rounded-2xl border bg-white p-10 text-center">
            <p className="text-lg font-semibold">You have no orders yet.</p>
            <Link
              href="/menu"
              className="mt-5 inline-block rounded-xl bg-yellow-400 px-8 py-3 font-bold hover:bg-yellow-500"
            >
              Browse Menu
            </Link>
          </div>
        )}

        <div className="mt-10 space-y-6">
          {orders.map((order) => {
            const id = String(order.id);
            const stepIndex = TRACK_STEPS.indexOf(order.status);
            const items = order.items ?? [];

            return (
              <section key={id} className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold">Order {shortId(id)}</h2>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-4 py-1 text-sm font-bold ${statusClasses(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {order.status === "Cancelled" ? (
                  <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
                    This order was cancelled.
                  </p>
                ) : (
                  <ol className="mt-6 grid grid-cols-5 gap-2 text-center text-xs">
                    {TRACK_STEPS.map((step, index) => (
                      <li key={step}>
                        <div
                          className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full font-bold ${
                            index <= stepIndex
                              ? "bg-yellow-400 text-black"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {index < stepIndex || order.status === "Delivered" ? "✓" : index + 1}
                        </div>
                        <p className={`mt-2 ${index <= stepIndex ? "font-semibold" : "text-gray-500"}`}>
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    {items.map((item, index) => (
                      <div key={index} className="flex justify-between gap-4">
                        <span>
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="font-semibold">
                          {money(Number(item.product.price) * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Delivery</span>
                      <span>{money(order.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold">
                      <span>Total</span>
                      <span>{money(order.total)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">Deliver to:</span> {order.delivery_address},{" "}
                      {order.delivery_district}, {order.delivery_city}
                    </p>
                    <p>
                      <span className="font-semibold">Payment:</span> {paymentLabel(order.payment_method)}
                    </p>
                    <p>
                      <span className="font-semibold">Payment status:</span>{" "}
                      <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${paymentClasses(order.payment_status)}`}>
                        {order.payment_status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>

                {order.payment_method !== "cash_on_delivery" &&
                  order.payment_status === "pending" &&
                  order.status !== "Cancelled" && (
                    <PayBox orderId={id} method={order.payment_method} onPaid={load} />
                  )}

                {order.status === "Delivered" && (
                  <FeedbackBox orderId={id} existing={feedback[id]} onSaved={load} />
                )}
              </section>
            );
          })}
        </div>
      </main>

      <Footer />
    </>
  );
}
