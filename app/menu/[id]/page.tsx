import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import ProductDetails from "@/components/product/ProductDetails";
import { products as staticProducts } from "@/data/products";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Product } from "@/types/product";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) notFound();

  let product: Product | undefined;
  let foundInDatabase = false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, price, image, description, rating, available")
      .eq("id", numericId)
      .maybeSingle();

    if (!error && data) {
      foundInDatabase = true;
      if (data.available) {
        product = {
          id: Number(data.id),
          name: String(data.name),
          category: String(data.category),
          price: Number(data.price),
          image: String(data.image),
          rating: Number(data.rating) || 5,
          description: String(data.description ?? ""),
        };
      }
    }
  } catch {
    // Fall back to the built-in menu below.
  }

  if (!foundInDatabase) {
    product = staticProducts.find((item) => item.id === numericId);
  }

  if (!product) notFound();

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16">
        <ProductDetails product={product} />
      </main>

      <Footer />
    </>
  );
}
