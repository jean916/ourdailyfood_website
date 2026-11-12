"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/orders";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface OrderSummary {
  customer_id: string | null;
  customer_email: string | null;
  total: number | string;
  status: string;
  created_at: string;
}

export default function AdminCustomersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const [profilesResult, ordersResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, avatar_url, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("customer_id, customer_email, total, status, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      if (profilesResult.error) {
        setError(
          "We couldn't load the customers. Make sure the profiles table exists (run the SQL setup)."
        );
      } else {
        setProfiles((profilesResult.data ?? []) as Profile[]);
      }

      if (!ordersResult.error) {
        setOrders((ordersResult.data ?? []) as OrderSummary[]);
      }

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    return profiles.map((profile) => {
      const mine = orders.filter((o) => o.customer_id === profile.id);
      const counted = mine.filter((o) => o.status !== "Cancelled");

      return {
        ...profile,
        email: mine.find((o) => o.customer_email)?.customer_email ?? "",
        orderCount: mine.length,
        spent: counted.reduce((sum, o) => sum + Number(o.total), 0),
        lastOrder: mine[0]?.created_at ?? "",
      };
    });
  }, [profiles, orders]);

  const term = search.trim().toLowerCase();
  const shown = rows.filter(
    (row) =>
      !term ||
      (row.full_name ?? "").toLowerCase().includes(term) ||
      (row.phone ?? "").includes(term) ||
      row.email.toLowerCase().includes(term)
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-extrabold">Customers</h1>
        <p className="mt-2 text-gray-600">
          Everyone who has an account, with their order history.
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or email"
          className="mt-6 w-full max-w-md rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-yellow-400"
        />

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8">Loading customers...</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Email (from orders)</th>
                  <th className="p-4">Orders</th>
                  <th className="p-4">Total spent</th>
                  <th className="p-4">Joined</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                )}
                {shown.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar url={row.avatar_url ?? undefined} name={row.full_name ?? "?"} size={40} />
                        <span className="font-semibold">{row.full_name || "(no name)"}</span>
                      </div>
                    </td>
                    <td className="p-4">{row.phone || "-"}</td>
                    <td className="p-4">{row.email || "-"}</td>
                    <td className="p-4">{row.orderCount}</td>
                    <td className="p-4 font-semibold">{money(row.spent)}</td>
                    <td className="p-4">{new Date(row.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          {shown.length} of {rows.length} customers
        </p>
      </div>
    </main>
  );
}
