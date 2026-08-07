"use client";

import ProductCard from "@/components/ui/ProductCard";
import { useMenu } from "@/context/MenuContext";

export default function MenuGrid() {
  const { products } = useMenu();

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
        <h2 className="text-2xl font-bold">No meals found</h2>
        <p className="mt-2 text-gray-600">Try another search or category.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}