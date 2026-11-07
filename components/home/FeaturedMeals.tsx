import { products as staticProducts } from "@/data/products";
import ProductCard from "@/components/ui/ProductCard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Product } from "@/types/product";

async function loadProducts(): Promise<Product[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, price, image, description, rating")
      .eq("available", true)
      .order("id")
      .limit(8);

    if (error || !data) return staticProducts;

    return data.map((p) => ({
      id: Number(p.id),
      name: String(p.name),
      category: String(p.category),
      price: Number(p.price),
      image: String(p.image),
      rating: Number(p.rating) || 5,
      description: String(p.description ?? ""),
    }));
  } catch {
    return staticProducts;
  }
}

export default async function FeaturedMeals() {
  const products = await loadProducts();

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-bold">Featured Meals</h2>
        <p className="mt-3 text-gray-600">Discover our most popular dishes.</p>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
