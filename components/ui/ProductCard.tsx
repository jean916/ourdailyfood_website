"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";

import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const { addToCart } = useCart();

  function handleAddToCart(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    addToCart(product);
  }

  return (
    <Link href={`/menu/${product.id}`}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg 
transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
        {/* Product Image */}
        <div className="relative h-60 w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 
(max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="p-5">
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm 
font-semibold text-yellow-700">
            {product.category}
          </span>

          <h3 className="mt-3 text-xl font-bold">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-1">
            {Array.from({
              length: product.rating,
            }).map((_, index) => (
              <Star
                key={index}
                size={16}
                className="fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>

          {/* Price + Cart */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-2xl font-bold">
              {product.price.toLocaleString()} RWF
            </p>

            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className="rounded-lg bg-yellow-400 p-3 transition 
hover:bg-yellow-500"
            >
              <ShoppingCart
                className="text-black"
                size={20}
              />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
