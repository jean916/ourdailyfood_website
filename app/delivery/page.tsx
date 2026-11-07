"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import { supabase } from "@/lib/supabase";
import {
  ORDER_COLUMNS,
  OrderRow,
  money,
  paymentLabel,
  shortId,
  statusClasses,
} from "@/lib/orders";

export default function DeliveryPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [state, setState] = useState<"loading" | "signed-out" | "not-agent" | "ready">("loading");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setState("signed-out");
      return;
    }

    const { data: isAgent } = await supabase.rpc("is_delivery_agent");

    if (isAgent !== true) {
      setState("not-agent");
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("delivery_agent_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("We couldn't load your deliveries.");
      return;
    }

    setOrders((data ?? []) as unknown as OrderRow[]);
    setState("ready");
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 15000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  async function setStatus(orderId: string, status: "Out for Delivery" | "Delivered") {
    setBusyId(orderId);
    setMessage("");

    const { error } = await supabase.rpc("delivery_set_status", {
      p_order_id: orderId,
      p_status: status,
    });

    setBusyId("");

    if (error) {
      setMessage(error.message);
      return;
    }

    await load();
  }

  const active = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
  const done = orders.filter((o) => o.status === "Delivered");

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-extrabold">My Deliveries</h1>
        <p className="mt-2 text-gray-600">Orders assigned to you by the restaurant.</p>

        {state === "signed-out" && (
          <div className="mt-8 rounded-2xl border bg-white p-8 text-center">
            <p className="font-semibold">Please sign in with your delivery account.</p>
            <Link
              href="/login?next=/delivery"
              className="mt-4 inline-block rounded-xl bg-yellow-400 px-8 py-3 font-bold hover:bg-yellow-500"
            >
              Sign in
            </Link>
          </div>
        )}

        {state === "not-agent" && (
          <p className="mt-8 rounded-2xl border bg-white p-8 text-center text-gray-700">
            This account is not registered as a delivery person. Ask the administrator to add you.
          </p>
        )}

        {message && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </p>
        )}

        {state === "ready" && (
          <>
            <h2 className="mt-10 text-2xl font-bold">To deliver ({active.length})</h2>

            {active.length === 0 && (
              <p className="mt-4 rounded-2xl border bg-white p-6 text-gray-600">
                No active deliveries right now.
              </p>
            )}

            <div className="mt-4 space-y-5">
              {active.map((order) => {
                const id = String(order.id);
                const canPickUp = order.status === "Confirmed" || order.status === "Preparing";
                const cash = order.payment_method === "cash_on_delivery" && order.payment_status !== "paid";

                return (
                  <section key={id} className="rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-extrabold">Order {shortId(id)}</h3>
                      <span className={`rounded-full px-4 py-1 text-sm font-bold ${statusClasses(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1 text-sm">
                      <p><span className="font-semibold">Customer:</span> {order.customer_name} · {order.customer_phone}</p>
                      <p>
                        <span className="font-semibold">Address:</span> {order.delivery_address},{" "}
                        {order.delivery_district}, {order.delivery_city}
                      </p>
                      {order.delivery_notes && (
                        <p><span className="font-semibold">Notes:</span> {order.delivery_notes}</p>
                      )}
                      <p><span className="font-semibold">Payment:</span> {paymentLabel(order.payment_method)} ({order.payment_status})</p>
                    </div>

                    {cash && (
                      <p className="mt-4 rounded-xl bg-yellow-50 p-3 font-bold">
                        Collect {money(order.total)} in cash.
                      </p>
                    )}

                    <div className="mt-5">
                      {canPickUp && (
                        <button
                          onClick={() => setStatus(id, "Out for Delivery")}
                          disabled={busyId === id}
                          className="rounded-xl bg-yellow-400 px-6 py-3 font-bold hover:bg-yellow-500 disabled:opacity-60"
                        >
                          {busyId === id ? "Saving..." : "Picked up: out for delivery"}
                        </button>
                      )}

                      {order.status === "Out for Delivery" && (
                        <button
                          onClick={() => setStatus(id, "Delivered")}
                          disabled={busyId === id}
                          className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          {busyId === id ? "Saving..." : "Confirm delivered"}
                        </button>
                      )}

                      {order.status === "Pending" && (
                        <p className="text-sm text-gray-500">Waiting for the restaurant to confirm this order.</p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            <h2 className="mt-12 text-2xl font-bold">Delivered ({done.length})</h2>
            <div className="mt-4 space-y-3">
              {done.map((order) => (
                <div key={order.id} className="flex justify-between rounded-xl border bg-white p-4 text-sm">
                  <span className="font-semibold">Order {shortId(String(order.id))}</span>
                  <span>{order.delivery_district} · {money(order.total)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
