"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { OrderRow, ORDER_STATUSES, money, shortId } from "@/lib/orders";

interface FeedbackRow {
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    async function load() {
      const [ordersResult, feedbackResult] = await Promise.all([
        supabase
          .from("orders")
          .select(
            "id, customer_name, delivery_district, items, subtotal, delivery_fee, total, status, created_at, payment_method, payment_status"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("feedback")
          .select("order_id, rating, comment, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      if (ordersResult.error) {
        setError("We couldn't load the report data. Check the order-table permissions.");
      } else {
        setOrders((ordersResult.data ?? []) as unknown as OrderRow[]);
      }

      if (!feedbackResult.error) {
        setFeedback((feedbackResult.data ?? []) as FeedbackRow[]);
      }

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const report = useMemo(() => {
    const counted = orders.filter((o) => o.status !== "Cancelled");
    const revenue = counted.reduce((sum, o) => sum + Number(o.total), 0);
    const paid = counted
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + Number(o.total), 0);

    const byStatus = ORDER_STATUSES.map((status) => {
      const rows = orders.filter((o) => o.status === status);
      return {
        status,
        count: rows.length,
        value: rows.reduce((sum, o) => sum + Number(o.total), 0),
      };
    });

    const days: { date: string; count: number; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 86400000).toISOString().slice(0, 10);
      const rows = counted.filter((o) => o.created_at.slice(0, 10) === date);
      days.push({
        date,
        count: rows.length,
        value: rows.reduce((sum, o) => sum + Number(o.total), 0),
      });
    }

    const itemTotals: Record<string, number> = {};
    counted.forEach((o) =>
      (o.items ?? []).forEach((item) => {
        itemTotals[item.product.name] = (itemTotals[item.product.name] ?? 0) + item.quantity;
      })
    );
    const topItems = Object.entries(itemTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const average =
      feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        : null;

    return { revenue, paid, byStatus, days, topItems, average };
  }, [orders, feedback, now]);

  function downloadCsv() {
    const header = [
      "Order",
      "Date",
      "Customer",
      "District",
      "Status",
      "Payment method",
      "Payment status",
      "Subtotal",
      "Delivery fee",
      "Total",
    ];

    const lines = orders.map((o) =>
      [
        shortId(String(o.id)),
        o.created_at,
        o.customer_name,
        o.delivery_district,
        o.status,
        o.payment_method,
        o.payment_status,
        o.subtotal,
        o.delivery_fee,
        o.total,
      ]
        .map(csvCell)
        .join(",")
    );

    const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ourdailyfood-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const card = "rounded-2xl border bg-white p-5 shadow-sm";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Sales &amp; order reports</h1>
            <p className="mt-2 text-gray-600">Cancelled orders are not counted in sales.</p>
          </div>
          <button
            onClick={downloadCsv}
            disabled={orders.length === 0}
            className="rounded-xl bg-yellow-400 px-6 py-3 font-bold hover:bg-yellow-500 disabled:opacity-50"
          >
            Download orders (CSV)
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8">Loading report...</p>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={card}>
                <p className="text-sm text-gray-500">Total orders</p>
                <p className="mt-2 text-3xl font-extrabold">{orders.length}</p>
              </div>
              <div className={card}>
                <p className="text-sm text-gray-500">Sales value</p>
                <p className="mt-2 text-2xl font-extrabold">{money(report.revenue)}</p>
              </div>
              <div className={card}>
                <p className="text-sm text-gray-500">Paid so far</p>
                <p className="mt-2 text-2xl font-extrabold text-green-600">{money(report.paid)}</p>
              </div>
              <div className={card}>
                <p className="text-sm text-gray-500">Average rating</p>
                <p className="mt-2 text-3xl font-extrabold">
                  {report.average ? report.average.toFixed(1) : "-"}
                  <span className="text-base font-normal text-gray-500"> ({feedback.length} reviews)</span>
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section className={card}>
                <h2 className="text-lg font-bold">Orders by status</h2>
                <table className="mt-3 w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr><th className="py-2">Status</th><th>Orders</th><th>Value</th></tr>
                  </thead>
                  <tbody>
                    {report.byStatus.map((row) => (
                      <tr key={row.status} className="border-t">
                        <td className="py-2">{row.status}</td>
                        <td>{row.count}</td>
                        <td>{money(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className={card}>
                <h2 className="text-lg font-bold">Last 7 days</h2>
                <table className="mt-3 w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr><th className="py-2">Date</th><th>Orders</th><th>Sales</th></tr>
                  </thead>
                  <tbody>
                    {report.days.map((row) => (
                      <tr key={row.date} className="border-t">
                        <td className="py-2">{row.date}</td>
                        <td>{row.count}</td>
                        <td>{money(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className={card}>
                <h2 className="text-lg font-bold">Top 5 items</h2>
                {report.topItems.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No sales yet.</p>
                ) : (
                  <table className="mt-3 w-full text-sm">
                    <thead className="text-left text-gray-500">
                      <tr><th className="py-2">Item</th><th>Units sold</th></tr>
                    </thead>
                    <tbody>
                      {report.topItems.map(([name, units]) => (
                        <tr key={name} className="border-t">
                          <td className="py-2">{name}</td>
                          <td>{units}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className={card}>
                <h2 className="text-lg font-bold">Recent customer feedback</h2>
                {feedback.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No feedback yet.</p>
                ) : (
                  <ul className="mt-3 space-y-3 text-sm">
                    {feedback.slice(0, 6).map((f) => (
                      <li key={f.order_id} className="border-t pt-3">
                        <span className="font-bold text-yellow-600">{"★".repeat(f.rating)}</span>{" "}
                        <span className="text-gray-400">{"★".repeat(5 - f.rating)}</span>
                        {f.comment && <p className="mt-1 text-gray-700">{f.comment}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
