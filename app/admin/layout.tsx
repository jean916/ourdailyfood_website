import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin-login");
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_store_admin");

  if (adminError || isAdmin !== true) {
    redirect("/");
  }

  const links = [
    { href: "/admin", label: "Orders" },
    { href: "/admin/assign", label: "Delivery & payments" },
    { href: "/admin/menu", label: "Menu" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/reports", label: "Reports" },
  ];

  return (
    <>
      <nav className="bg-black text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 text-sm font-semibold">
          <span className="text-yellow-400">Admin</span>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-yellow-400">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </>
  );
}
