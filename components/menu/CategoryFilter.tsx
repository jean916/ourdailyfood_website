"use client";

import { useMenu } from "@/context/MenuContext";

export default function CategoryFilter() {
  const { categories, category, setCategory } = useMenu();

  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {categories.map((item) => (
        <button
          key={item}
          onClick={() => setCategory(item)}
          className={`rounded-full border px-5 py-2 font-medium transition ${
            category === item
              ? "border-yellow-400 bg-yellow-400 text-black"
              : "bg-white hover:border-yellow-400 hover:bg-yellow-50"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}