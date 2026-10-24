"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function handleForgotPassword() {
    const emailAddress = email.trim();

    if (!emailAddress) {
      setErrorMessage("Enter your admin email address first.");
      return;
    }

    setErrorMessage("");
    setIsResetting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        emailAddress,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        console.error("Password reset error:", error);
        setErrorMessage(
          `Reset failed: ${error.message} (${error.status ?? "no status"})`
        );
      } else {
        setErrorMessage(
          "If the account exists, a password reset email has been requested. Check your inbox and spam folder."
        );
      }
    } catch (error) {
      console.error("Unexpected password reset error:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage("Login failed. Check your email and password.");
        return;
      }

      if (!data.user) {
        setErrorMessage(
          "Unable to verify your account. Please try again."
        );
        return;
      }

      const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_store_admin");

      if (adminError || !isAdmin) {
        console.error("Admin verification error:", adminError);

        await supabase.auth.signOut();

        setErrorMessage(
          "Admin verification failed. Please check the admin setup."
        );
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Admin login error:", error);
      setErrorMessage("Something went wrong. Please try again.");
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
            Admin Login
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage store orders.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
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
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              placeholder="Enter your admin email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              placeholder="Enter your password"
            />

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading || isResetting}
                className="text-sm font-medium text-green-700 hover:text-green-900 disabled:opacity-60"
              >
                {isResetting
                  ? "Requesting reset..."
                  : "Forgot password?"}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p
              role="status"
              className="break-words text-sm text-red-600"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || isResetting}
            className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Authorized store administrators only.
        </p>
      </section>
    </main>
  );
}