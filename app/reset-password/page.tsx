
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function initializeRecovery() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorDescription =
          url.searchParams.get("error_description");

        if (errorDescription) {
          throw new Error(
            "The reset link was rejected or has expired. Please use a valid recovery email link."
          );
        }

        // Handle Supabase PKCE email links.
        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;

          if (!data.session) {
            throw new Error("Could not establish a recovery session.");
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          if (active) {
            setIsReady(true);
            setMessage("");
          }
          return;
        }

        // Handle recovery links containing URL-fragment tokens.
        const fragment = new URLSearchParams(
          window.location.hash.substring(1)
        );

        const accessToken = fragment.get("access_token");
        const refreshToken = fragment.get("refresh_token");
        const tokenType = fragment.get("type");

        if (accessToken && refreshToken) {
          if (tokenType !== "recovery") {
            throw new Error(
              "Please open the password-reset link from your recovery email."
            );
          }

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          if (!data.session) {
            throw new Error("Could not establish a recovery session.");
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          if (active) {
            setIsReady(true);
            setMessage("");
          }
          return;
        }

        // Handle links containing a token hash.
        const tokenHash = url.searchParams.get("token_hash");
        const queryType = url.searchParams.get("type");

        if (tokenHash && queryType === "recovery") {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

          if (error) throw error;

          if (!data.session) {
            throw new Error("Could not establish a recovery session.");
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          if (active) {
            setIsReady(true);
            setMessage("");
          }
          return;
        }

        // Do not treat an ordinary login session as recovery verification.
        if (active) {
          setMessage(
            "Open the password-reset link from your recovery email to continue."
          );
        }
      } catch (error) {
        console.error("Recovery link processing failed:", error);

        if (active) {
          setIsReady(false);
          setMessage(
            error instanceof Error
              ? error.message
              : "We couldn't verify this reset link. Please try again with a valid recovery email link."
          );
        }
      }
    }

    initializeRecovery();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    if (!isReady) {
      setMessage(
        "Please open a valid password-reset link from your email first."
      );
      return;
    }

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        return;
      }

      setIsReady(false);
      await supabase.auth.signOut();

      setMessage(
        "Password updated successfully. Redirecting to login..."
      );

      window.setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-md"
      >
        <h1 className="text-2xl font-bold text-gray-900">
          Reset your password
        </h1>

        <p className="text-sm text-gray-600">
          Choose a new password for your OUR DAILY FOOD account.
        </p>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="At least 8 characters"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium"
          >
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Enter the same password again"
          />
        </div>

        {message && (
          <p role="status" className="text-sm text-gray-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={!isReady || isLoading}
          className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!isReady
            ? "Waiting for reset link..."
            : isLoading
              ? "Updating password..."
              : "Update password"}
        </button>
      </form>
    </main>
  );
}
