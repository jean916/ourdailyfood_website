"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, Menu } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";import Avatar from "@/components/ui/Avatar";

export default function Navbar() {
  const router = useRouter();
  const { cartItems } = useCart();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false); const [avatarUrl, setAvatarUrl] = useState(""); const [displayName, setDisplayName] = useState("");
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;

      setSignedIn(Boolean(data.user)); setAvatarUrl(String(data.user?.user_metadata?.avatar_url ?? "")); setDisplayName(String(data.user?.user_metadata?.full_name ?? data.user?.email ?? ""));

      if (!data.user) {
        setIsAdmin(false);
        setIsAgent(false);
        return;
      }

      const [admin, agent] = await Promise.all([
        supabase.rpc("is_store_admin"),
        supabase.rpc("is_delivery_agent"),
      ]);

      if (!active) return;
      setIsAdmin(admin.data === true);
      setIsAgent(agent.data === true);
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const accountLinks = signedIn
    ? [
        { href: "/my-orders", label: "My orders" },
        { href: "/profile", label: "Profile" },
        ...(isAgent ? [{ href: "/delivery", label: "Deliveries" }] : []),
        ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [
        { href: "/login", label: "Login" },
        { href: "/register", label: "Register" },
      ];

  return (
    <header className="sticky top-0 z-50 bg-black text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-extrabold text-yellow-400 sm:text-3xl">
          OurDailyFood
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-yellow-400">
              {link.label}
            </Link>
          ))}
          <span className="h-5 w-px bg-gray-700" />
          {accountLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm hover:text-yellow-400">
              {link.label}
            </Link>
          ))}
          {signedIn && (
            <button onClick={signOut} className="text-sm text-gray-300 hover:text-yellow-400">
              Sign out
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {signedIn && (<Link href="/profile" aria-label="Your profile" title="Your profile" className="rounded-full ring-2 ring-yellow-400 transition hover:ring-white"><Avatar url={avatarUrl} name={displayName} size={36} /></Link>)}<Link href="/cart" className="relative rounded-lg bg-yellow-400 p-2 text-black hover:bg-yellow-500">
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={28} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-gray-800 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {[...links, ...accountLinks].map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            {signedIn && (
              <button onClick={signOut} className="text-left">
                Sign out
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
