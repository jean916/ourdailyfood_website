import Link from "next/link";

interface CartSummaryProps {
  subtotal: number;
}

export default function CartSummary({
  subtotal,
}: CartSummaryProps) {
  const deliveryFee = subtotal > 0 ? 1500 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold">
        Order Summary
      </h2>

      <div className="mt-6 space-y-4">
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

      <Link
        href="/checkout"
        className="mt-6 block w-full rounded-xl bg-yellow-400 py-4 
text-center font-bold transition hover:bg-yellow-500"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
