"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ORDER_COLUMNS,
  OrderRow,
  money,
  paymentClasses,
  paymentLabel,
  shortId,
  statusClasses,
} from "@/lib/orders";

interface Agent {
  user_id: string;
  full_name: string;
}

export default function AssignDeliveryPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    const [ordersResult, agentsResult] = await Promise.all([
      supabase.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false }),
      supabase.from("delivery_agents").select("user_id, full_name").order("full_name"),
    ]);

    if (ordersResult.error) {
      setMessage("We couldn't load orders. Check the order-table permissions.");
    } else {
      setOrders((ordersResult.data ?? []) as unknown as OrderRow[]);
    }

    if (!agentsResult.error) {
      setAgents((agentsResult.data ?? []) as Agent[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load]);

  async function assign(orderId: string, agentId: string) {
    setBusyId(orderId);
    setMessage("");

    const { error } = await supabase
      .from("orders")
      .update({ delivery_agent_id: agentId || null })
      .eq("id", orderId);

    setBusyId("");

    if (error) {
      setMessage("The delivery person could not be saved. Please try again.");
      return;
    }

    await load();
  }

  const open = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-extrabold">Delivery &amp; payments</h1>
        <p className="mt-2 text-gray-600">
          Assign a delivery person to each open order and check its payment status.
        </p>

        {agents.length === 0 && !loading && (
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            No delivery people are registered yet. Add one in Supabase (table delivery_agents).
          </p>
        )}

        {message && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </p>
        )}

        {loading ? (
          <p className="mt-8">Loading orders...</p>
        ) : open.length === 0 ? (
          <p className="mt-8 rounded-2xl border bg-white p-8 text-center">No open orders.</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Delivery person</th>
                </tr>
              </thead>
              <tbody>
                {open.map((order) => {
                  const id = String(order.id);
                  return (
                    <tr key={id} className="border-b last:border-0">
                      <td className="p-4 font-semibold">{shortId(id)}</td>
                      <td className="p-4">
                        {order.customer_name}
                        <br />
                        <span className="text-gray-500">{order.delivery_district}</span>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {paymentLabel(order.payment_method)}
                        <br />
                        <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${paymentClasses(order.payment_status)}`}>
                          {order.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">{money(order.total)}</td>
                      <td className="p-4">
                        <select
                          value={order.delivery_agent_id ?? ""}
                          disabled={busyId === id}
                          onChange={(e) => assign(id, e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white p-2"
                        >
                          <option value="">Not assigned</option>
                          {agents.map((agent) => (
                            <option key={agent.user_id} value={agent.user_id}>
                              {agent.full_name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
