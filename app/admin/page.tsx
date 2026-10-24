"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useOrders, Order } from "@/context/OrderContext";

const statuses: Order["status"][] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

interface DatabaseOrder {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_district: string;
  delivery_notes: string | null;
  items: unknown;
  subtotal: number | string;
  delivery_fee: number | string;
  total: number | string;
  status: Order["status"];
  created_at: string;
}

interface DisplayOrder {
  id: string;
  createdAt: string;
  status: Order["status"];
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  delivery: {
    address: string;
    city: string;
    district: string;
    notes: string;
  };
  items: Order["items"];
  subtotal: number;
  deliveryFee: number;
  total: number;
  source: "database" | "local";
}

function toDisplayOrder(row: DatabaseOrder): DisplayOrder {
  const nameParts = (row.customer_name || "").trim().split(/\s+/);
  const firstName = nameParts.shift() || "";
  const lastName = nameParts.join(" ");

  const items = Array.isArray(row.items)
    ? row.items
    : [];

  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    customer: {
      firstName,
      lastName,
      phone: row.customer_phone || "",
      email: row.customer_email || "",
    },
    delivery: {
      address: row.delivery_address || "",
      city: row.delivery_city || "",
      district: row.delivery_district || "",
      notes: row.delivery_notes || "",
    },
    items: items as Order["items"],
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    source: "database",
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { orders: localOrders, updateOrderStatus } = useOrders();

  const [databaseOrders, setDatabaseOrders] = useState<DisplayOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  const loadOrders = useCallback(async () => {
    setPageError("");

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/admin-login");
      return;
    }

    const { data: isAdmin, error: adminError } =
      await supabase.rpc("is_store_admin");

    if (adminError || !isAdmin) {
      await supabase.auth.signOut();
      router.replace("/admin-login");
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, customer_id, customer_name, customer_email, customer_phone, delivery_address, delivery_city, delivery_district, delivery_notes, items, subtotal, delivery_fee, total, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load database orders:", error);
      setPageError(
        "We couldn't load orders from the database. Please check your connection and order-table permissions."
      );
      return;
    }

    setDatabaseOrders(
      (data as DatabaseOrder[]).map(toDisplayOrder)
    );
  }, [router]);

  useEffect(() => {
    let active = true;

    async function initializePage() {
      try {
        await loadOrders();
      } catch (error) {
        console.error("Admin page error:", error);
        if (active) {
          setPageError("Something went wrong while loading orders.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    initializePage();

    return () => {
      active = false;
    };
  }, [loadOrders]);

  async function handleStatusChange(
    orderId: string,
    newStatus: Order["status"]
  ) {
    setUpdatingOrderId(orderId);
    setPageError("");

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      setPageError("Your admin session has expired. Please sign in again.");
      router.replace("/admin-login");
      setUpdatingOrderId("");
      return;
    }

    const { data: isAdmin, error: adminError } =
      await supabase.rpc("is_store_admin");

    if (adminError || !isAdmin) {
      setPageError("Admin permission could not be verified.");
      setUpdatingOrderId("");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Failed to update order status:", error);
      setPageError(
        "The order status could not be saved. Please try again."
      );
      setUpdatingOrderId("");
      return;
    }

    setDatabaseOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );

    setUpdatingOrderId("");
  }

  const localDisplayOrders: DisplayOrder[] = localOrders.map((order) => ({
    ...order,
    source: "local",
  }));

  // Show database orders plus local orders that are not already represented
  // by a database order. This keeps older browser orders visible.
  const databaseIds = new Set(databaseOrders.map((order) => order.id));
  const combinedOrders = [
    ...databaseOrders,
    ...localDisplayOrders.filter((order) => !databaseIds.has(order.id)),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  const formatMoney = (amount: number) =>
    `${amount.toLocaleString()} RWF`;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-yellow-600">OurDailyFood</p>
            <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
              Admin Orders
            </h1>
            <p className="mt-2 text-gray-600">
              View orders and update their progress.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border bg-white px-5 py-3 font-semibold hover:bg-gray-100"
          >
            Back to Website
          </Link>
        </div>

        {pageError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {pageError}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="mt-2 text-3xl font-extrabold">
              {combinedOrders.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending Orders</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">
              {
                combinedOrders.filter(
                  (order) => order.status === "Pending"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Delivered Orders</p>
            <p className="mt-2 text-3xl font-extrabold text-green-600">
              {
                combinedOrders.filter(
                  (order) => order.status === "Delivered"
                ).length
              }
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            Loading orders...
          </div>
        ) : combinedOrders.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <h2 className="text-xl font-bold">No orders yet</h2>
            <p className="mt-2 text-gray-600">
              New orders will appear here when customers place them.
            </p>
            <Link
              href="/menu"
              className="mt-5 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-bold hover:bg-yellow-500"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {combinedOrders.map((order) => (
              <section
                key={`${order.source}-${order.id}`}
                className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="break-all text-lg font-extrabold">
                      {order.id}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    {order.source === "local" && (
                      <p className="mt-1 text-xs text-amber-700">
                        Older order stored in this browser
                      </p>
                    )}
                  </div>

                  <div className="min-w-48">
                    <label
                      htmlFor={`status-${order.source}-${order.id}`}
                      className="mb-2 block text-sm font-semibold"
                    >
                      Order Status
                    </label>
                    <select
                      id={`status-${order.source}-${order.id}`}
                      value={order.status}
                      disabled={
                        order.source === "local" ||
                        updatingOrderId === order.id
                      }
                      onChange={(event) => {
                        const nextStatus = event.target.value as Order["status"];

                        if (order.source === "database") {
                          handleStatusChange(order.id, nextStatus);
                        } else {
                          updateOrderStatus(order.id, nextStatus);
                        }
                      }}
                      className="w-full rounded-xl border border-gray-300 bg-white p-3 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {updatingOrderId === order.id && (
                      <p className="mt-1 text-xs text-gray-500">
                        Saving status...
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-bold">Customer</h3>
                    <p className="mt-2 text-gray-700">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                    <p className="text-gray-600">{order.customer.phone}</p>
                    <p className="break-all text-gray-600">
                      {order.customer.email}
                    </p>

                    <h3 className="mt-5 font-bold">Delivery Address</h3>
                    <p className="mt-2 text-gray-700">
                      {order.delivery.address}
                    </p>
                    <p className="text-gray-600">
                      {order.delivery.district}, {order.delivery.city}
                    </p>
                    {order.delivery.notes && (
                      <p className="mt-2 text-sm text-gray-500">
                        Notes: {order.delivery.notes}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold">Items Ordered</h3>
                    <div className="mt-2 space-y-3">
                      {order.items.map((item, index) => (
                        <div
                          key={`${item.product.id}-${index}`}
                          className="flex justify-between gap-4 text-sm"
                        >
                          <span>
                            {item.product.name} × {item.quantity}
                          </span>
                          <span className="shrink-0 font-semibold">
                            {formatMoney(
                              Number(item.product.price) * item.quantity
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 space-y-2 border-t pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatMoney(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery</span>
                        <span>{formatMoney(order.deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-3 text-lg font-extrabold">
                        <span>Total</span>
                        <span>{formatMoney(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}