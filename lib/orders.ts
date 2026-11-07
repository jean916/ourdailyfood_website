export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// The steps shown in the customer's tracking timeline.
export const TRACK_STEPS: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];

export const PAYMENT_METHODS = [
  { value: "cash_on_delivery", label: "Cash on delivery" },
  { value: "mobile_money", label: "Mobile money (demo)" },
  { value: "card", label: "Bank card (demo)" },
] as const;

export function paymentLabel(value: string) {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

export interface OrderItem {
  product: { id: number | string; name: string; price: number | string };
  quantity: number;
}

export interface OrderRow {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_district: string;
  delivery_notes: string | null;
  items: OrderItem[] | null;
  subtotal: number | string;
  delivery_fee: number | string;
  total: number | string;
  status: OrderStatus;
  created_at: string;
  payment_method: string;
  payment_status: string;
  delivery_agent_id: string | null;
}

export const ORDER_COLUMNS =
  "id, customer_id, customer_name, customer_email, customer_phone, delivery_address, delivery_city, delivery_district, delivery_notes, items, subtotal, delivery_fee, total, status, created_at, payment_method, payment_status, delivery_agent_id";

export function money(amount: number | string) {
  return `${Number(amount).toLocaleString()} RWF`;
}

export function shortId(id: string) {
  return String(id).slice(0, 8).toUpperCase();
}

export function statusClasses(status: string) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    case "Out for Delivery":
      return "bg-blue-100 text-blue-700";
    case "Preparing":
    case "Confirmed":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function paymentClasses(status: string) {
  return status === "paid"
    ? "bg-green-100 text-green-700"
    : status === "failed"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-800";
}
