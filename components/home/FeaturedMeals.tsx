import { products } from "@/data/products";
import ProductCard from "@/components/ui/ProductCard";

export default function FeaturedMeals() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-bold">Featured Meals</h2>
        <p className="mt-3 text-gray-600">Discover our most popular dishes.</p>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}