"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

export default function CartItem({ product, quantity }: { product: Product; quantity: number }) {
  const { increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  return (
    <div className="flex flex-col gap-5 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center">
      <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:w-28">
        <Image src={product.image} alt={product.name} fill sizes="112px" className="object-cover" />
      </div>

      <div className="flex-1">
        <h2 className="text-xl font-bold">{product.name}</h2>
        <p className="text-gray-500">{product.category}</p>
        <p className="mt-2 font-bold text-yellow-600">{product.price.toLocaleString()} RWF</p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => decreaseQuantity(product.id)} className="rounded-lg border p-2 hover:bg-gray-100" aria-label="Decrease quantity">
          <Minus size={18} />
        </button>
        <span className="min-w-8 text-center font-bold">{quantity}</span>
        <button onClick={() => increaseQuantity(product.id)} className="rounded-lg border p-2 hover:bg-gray-100" aria-label="Increase quantity">
          <Plus size={18} />
        </button>
      </div>

      <button onClick={() => removeFromCart(product.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remove item">
        <Trash2 size={20} />
      </button>
    </div>
  );
}