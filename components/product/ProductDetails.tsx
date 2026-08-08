"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ShoppingCart,
  ArrowLeft,
  Minus,
  Plus,
} from "lucide-react";
import { useState } from "react";

import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({
  product,
}: ProductDetailsProps) {
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);

  function increaseQuantity() {
    setQuantity((current) => current + 1);
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function handleAddToCart() {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {/* Product Image */}
      <div className="relative h-[450px] overflow-hidden rounded-3xl 
bg-gray-100 shadow-lg">
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* Product Information */}
      <div className="flex flex-col justify-center">
        {/* Back Button */}
        <Link
          href="/menu"
          className="mb-8 flex w-fit items-center gap-2 text-gray-600 
transition hover:text-black"
        >
          <ArrowLeft size={18} />
          Back to menu
        </Link>

        {/* Category */}
        <span className="w-fit rounded-full bg-yellow-100 px-3 py-1 
text-sm font-semibold text-yellow-700">
          {product.category}
        </span>

        {/* Name */}
        <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
          {product.name}
        </h1>

        {/* Rating */}
        <div className="mt-5 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={20}
              className={
                index < product.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }
            />
          ))}

          <span className="ml-2 text-sm text-gray-500">
            {product.rating}/5
          </span>
        </div>

        {/* Description */}
        <p className="mt-6 text-lg leading-8 text-gray-600">
          {product.description}
        </p>

        {/* Price */}
        <p className="mt-8 text-3xl font-extrabold">
          {product.price.toLocaleString()} RWF
        </p>

        {/* Quantity */}
        <div className="mt-8">
          <p className="mb-3 font-semibold">
            Quantity
          </p>

          <div className="flex w-fit items-center overflow-hidden 
rounded-xl border">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity === 1}
              className="p-3 transition hover:bg-gray-100 
disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={20} />
            </button>

            <span className="min-w-12 text-center font-bold">
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              className="p-3 transition hover:bg-gray-100"
              aria-label="Increase quantity"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Add To Cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-8 flex w-full items-center justify-center gap-3 
rounded-xl bg-yellow-400 py-4 font-bold transition hover:bg-yellow-500 
sm:w-fit sm:px-8"
        >
          <ShoppingCart size={21} />
          Add {quantity} to Cart
        </button>
      </div>
    </div>
  );
}
