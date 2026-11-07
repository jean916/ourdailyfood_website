"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import Avatar from "@/components/ui/Avatar";
import { supabase } from "@/lib/supabase";
import { checkAvatarFile, uploadAvatar } from "@/lib/avatar";

export default function ProfilePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setSignedIn(false);
        return;
      }

      setSignedIn(true);
      setUserId(data.user.id);
      setEmail(data.user.email ?? "");
      setFullName(String(data.user.user_metadata?.full_name ?? ""));
      setPhone(String(data.user.user_metadata?.phone ?? ""));
      setAvatarUrl(String(data.user.user_metadata?.avatar_url ?? ""));
    });
  }, []);

  async function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const problem = checkAvatarFile(file);

    if (problem) {
      setPhotoMessage(problem);
      return;
    }

    setUploading(true);
    setPhotoMessage("");

    try {
      const url = await uploadAvatar(userId, file);
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: url } });

      if (error) throw new Error("The photo could not be saved.");

      setAvatarUrl(url);
      setPhotoMessage("Photo updated.");
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : "The photo could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    setPhotoMessage("");

    const { error } = await supabase.auth.updateUser({ data: { avatar_url: "" } });

    setUploading(false);

    if (error) {
      setPhotoMessage("The photo could not be removed.");
      return;
    }

    setAvatarUrl("");
    setPhotoMessage("Photo removed.");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), phone: phone.trim() },
    });

    setSaving(false);
    setMessage(error ? "Could not save your profile." : "Profile saved.");
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-4xl font-extrabold">My Profile</h1>

        {signedIn === false && (
          <div className="mt-8 rounded-2xl border bg-white p-8 text-center">
            <p className="font-semibold">Please sign in to edit your profile.</p>
            <Link
              href="/login?next=/profile"
              className="mt-4 inline-block rounded-xl bg-yellow-400 px-8 py-3 font-bold hover:bg-yellow-500"
            >
              Sign in
            </Link>
          </div>
        )}

        {signedIn && (
          <>
            <section className="mt-8 flex flex-col items-center gap-4 rounded-2xl border bg-white p-8 shadow-sm">
              <Avatar url={avatarUrl} name={fullName || email} size={120} />

              <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                <label
                  className={`cursor-pointer rounded-xl bg-yellow-400 px-6 py-3 font-bold hover:bg-yellow-500 ${
                    uploading ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  {uploading ? "Uploading..." : avatarUrl ? "Change photo" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhoto}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={uploading}
                    className="font-semibold text-gray-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500">JPG, PNG or WebP, up to 5 MB.</p>
              {photoMessage && (
                <p role="status" className="text-sm text-gray-700">
                  {photoMessage}
                </p>
              )}
            </section>

            <form onSubmit={handleSave} className="mt-6 space-y-6 rounded-2xl border bg-white p-8 shadow-sm">
              <div>
                <label className="mb-2 block font-medium">Email</label>
                <input
                  value={email}
                  disabled
                  className="w-full rounded-xl border border-gray-300 bg-gray-100 p-4"
                />
              </div>

              <div>
                <label htmlFor="fullName" className="mb-2 block font-medium">Full name</label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block font-medium">Phone number</label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={20}
                  placeholder="0788123456"
                  className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
              </div>

              {message && <p className="text-sm text-gray-700">{message}</p>}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-yellow-400 px-8 py-3 font-bold hover:bg-yellow-500 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save profile"}
                </button>
                <Link href="/forgot-password" className="text-sm font-semibold text-gray-600 hover:text-black">
                  Change password
                </Link>
              </div>
            </form>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
