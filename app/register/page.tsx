"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { checkAvatarFile, uploadAvatar } from "@/lib/avatar";
import Avatar from "@/components/ui/Avatar";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const problem = checkAvatarFile(file);

    if (problem) {
      setMessage(problem);
      return;
    }

    setMessage("");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto(null);
    setPreview("");
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session && data.user) {
        let note = "";

        if (photo) {
          try {
            const url = await uploadAvatar(data.user.id, photo);
            await supabase.auth.updateUser({ data: { avatar_url: url } });
          } catch {
            note = " Your photo could not be uploaded. You can add it later in Profile.";
          }
        }

        setIsDone(true);
        setMessage("Your account was created successfully. You can now continue shopping." + note);
      } else {
        setIsDone(true);
        setMessage(
          "Your account request was received. Please check your email for a confirmation link before signing in." +
            (photo ? " After you sign in, add your photo in Profile." : "")
        );
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-yellow-500">
            OUR DAILY FOOD
          </h1>
          <h2 className="mt-3 text-xl font-semibold text-gray-800">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join us for an easier ordering experience.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <Avatar url={preview} name={fullName} size={96} />
            <div className="flex items-center gap-3 text-sm">
              <label className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:border-yellow-400 hover:bg-yellow-50">
                {photo ? "Change photo" : "Add profile photo (optional)"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhoto}
                  className="hidden"
                />
              </label>
              {photo && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="font-semibold text-gray-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">JPG, PNG or WebP, up to 5 MB.</p>
          </div>

          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              placeholder="At least 8 characters"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use at least 8 characters.
            </p>
          </div>

          {message && (
            <p role="status" className="text-sm text-yellow-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || isDone}
            className="w-full rounded-lg bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>

          {isDone && (
            <Link
              href="/menu"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-semibold hover:border-yellow-400"
            >
              Continue to menu
            </Link>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-yellow-700 hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-gray-600">
          Prefer not to register?{" "}
          <Link href="/checkout" className="font-semibold text-yellow-700 hover:underline">
            Continue as a guest
          </Link>
        </p>
      </section>
    </main>
  );
}
