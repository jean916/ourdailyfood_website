"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, ArrowLeft } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

export default function ProductDetails({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="relative min-h-[420px] overflow-hidden rounded-3xl bg-white shadow-sm">
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col justify-center">
        <Link href="/menu" className="mb-8 flex w-fit items-center gap-2 text-gray-600 hover:text-black">
          <ArrowLeft size={18} /> Back to menu
        </Link>
        <span className="w-fit rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
          {product.category}
        </span>
        <h1 className="mt-4 text-4xl font-extrabold">{product.name}</h1>
        <div className="mt-4 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={18} className={i < product.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
          ))}
        </div>
        <p className="mt-6 text-lg leading-8 text-gray-600">{product.description}</p>
        <p className="mt-8 text-3xl font-extrabold">{product.price.toLocaleString()} RWF</p>
        <button
          onClick={() => addToCart(product)}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-yellow-400 py-4 font-bold hover:bg-yellow-500 sm:w-fit sm:px-8"
        >
          <ShoppingCart size={21} /> Add to Cart
        </button>
      </div>
    </div>
  );
}