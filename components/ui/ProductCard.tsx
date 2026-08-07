"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <Link href={`/menu/${product.id}`}>
        <div className="relative h-60 w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
      </Link>

      <div className="p-5">
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
          {product.category}
        </span>
        <Link href={`/menu/${product.id}`}>
          <h3 className="mt-3 text-xl font-bold hover:text-yellow-600">{product.name}</h3>
        </Link>

        <div className="mt-2 flex items-center gap-1" aria-label={`${product.rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={16}
              className={i < product.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xl font-extrabold">{product.price.toLocaleString()} RWF</p>
          <button
            onClick={() => addToCart(product)}
            className="rounded-lg bg-yellow-400 p-3 transition hover:bg-yellow-500"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="text-black" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}