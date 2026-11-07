"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Demo online payment confirmed with a one-time code (OTP).
// A real system would send the code by SMS and confirm through a payment provider.
export default function PayBox({
  orderId,
  method,
  onPaid,
}: {
  orderId: string;
  method: string;
  onPaid: () => void;
}) {
  const [step, setStep] = useState<"start" | "otp">("start");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function requestCode() {
    setBusy(true);
    setMessage("");

    const { data, error } = await supabase.rpc("request_payment_otp", {
      p_order_id: orderId,
      p_phone: method === "mobile_money" ? phone.trim() : null,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setDemoCode(String(data?.demo_code ?? ""));
    setCode("");
    setStep("otp");
    setMessage("Demo mode: no SMS is sent, so the code is shown here.");
  }

  async function confirm() {
    setBusy(true);
    setMessage("");

    const { data, error } = await supabase.rpc("confirm_payment_otp", {
      p_order_id: orderId,
      p_code: code.trim(),
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data?.ok) {
      setMessage(String(data?.message ?? "Could not confirm the payment."));
      return;
    }

    setMessage(String(data.message));
    onPaid();
  }

  return (
    <div className="mt-5 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
      {step === "start" ? (
        <>
          <p className="text-sm text-gray-700">
            Pay online with a one-time code (OTP). Demo mode: no real money is charged.
          </p>

          {method === "mobile_money" && (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile money number, e.g. 0788123456"
              inputMode="numeric"
              maxLength={10}
              className="mt-3 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-yellow-400"
            />
          )}

          <button
            onClick={requestCode}
            disabled={busy}
            className="mt-3 rounded-lg bg-yellow-400 px-5 py-2 font-bold hover:bg-yellow-500 disabled:opacity-60"
          >
            {busy ? "Sending..." : "Send OTP code"}
          </button>
        </>
      ) : (
        <>
          {demoCode && (
            <p className="text-sm font-bold">
              Demo OTP: {demoCode}{" "}
              <span className="font-normal text-gray-600">(a real system sends this by SMS)</span>
            </p>
          )}

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={6}
            className="mt-3 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-yellow-400"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={confirm}
              disabled={busy || code.trim().length !== 6}
              className="rounded-lg bg-yellow-400 px-5 py-2 font-bold hover:bg-yellow-500 disabled:opacity-60"
            >
              {busy ? "Checking..." : "Confirm payment"}
            </button>
            <button
              onClick={requestCode}
              disabled={busy}
              className="rounded-lg border bg-white px-5 py-2 font-semibold hover:bg-gray-100"
            >
              Send a new code
            </button>
          </div>
        </>
      )}

      {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
    </div>
  );
}
