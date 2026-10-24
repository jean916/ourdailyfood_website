
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

  return <>{children}</>;
}
