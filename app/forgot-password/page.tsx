
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim();

      if (!normalizedEmail) {
        setMessage("Please enter your email address.");
        return;
      }

      const redirectTo =
        `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo }
      );

      if (error) {
        console.error(
          "Password reset request failed:",
          error.message
        );

        if (error.message.toLowerCase().includes("rate limit")) {
          setMessage(
            "Too many reset requests. Please wait before requesting another email."
          );
        } else {
          setMessage(
            "We couldn't send the reset email. Please try again later."
          );
        }

        return;
      }

      setMessage(
        "If an account exists for this email, a reset email will be sent. Open the email in this same browser and use the newest link."
      );
    } catch (error) {
      console.error("Password reset request failed:", error);

      setMessage("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-800">
            OUR DAILY FOOD
          </h1>

          <h2 className="mt-3 text-xl font-semibold text-gray-800">
            Reset your password
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Enter the email address you used to register.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              placeholder="you@example.com"
            />
          </div>

          {message && (
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-gray-700"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Sending..." : "Send reset email"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-green-700 hover:underline"
          >
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
