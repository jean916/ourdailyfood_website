"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function FeedbackBox({
  orderId,
  existing,
  onSaved,
}: {
  orderId: string;
  existing?: { rating: number; comment: string | null };
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true);
    setMessage("");

    const { error } = await supabase
      .from("feedback")
      .upsert(
        { order_id: orderId, rating, comment: comment.trim() || null },
        { onConflict: "order_id" }
      );

    setBusy(false);

    if (error) {
      setMessage("Could not save your feedback. Please try again.");
      return;
    }

    setMessage("Thank you for your feedback!");
    onSaved();
  }

  return (
    <div className="mt-5 rounded-xl border bg-gray-50 p-4">
      <p className="font-bold">{existing ? "Your feedback" : "Rate this order"}</p>

      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              size={26}
              className={n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Tell us about your meal and delivery (optional)"
        className="mt-3 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-yellow-400"
      />

      <button
        onClick={save}
        disabled={busy}
        className="mt-3 rounded-lg bg-yellow-400 px-5 py-2 font-bold hover:bg-yellow-500 disabled:opacity-60"
      >
        {busy ? "Saving..." : existing ? "Update feedback" : "Submit feedback"}
      </button>

      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
}
