"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { products as staticProducts } from "@/data/products";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";

interface MenuContextType {
  products: Product[];
  search: string;
  category: string;
  setSearch: (value: string) => void;
  setCategory: (value: string) => void;
  categories: string[];
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  // Start with the built-in menu; replace it with the database menu when available.
  const [allProducts, setAllProducts] = useState<Product[]>(staticProducts);

  useEffect(() => {
    let active = true;

    supabase
      .from("products")
      .select("id, name, category, price, image, description, rating")
      .eq("available", true)
      .order("id")
      .then(({ data, error }) => {
        if (error) console.warn("Menu could not be loaded from the database:", error.message); if (!active || error || !data) return;

        setAllProducts(
          data.map((p) => ({
            id: Number(p.id),
            name: String(p.name),
            category: String(p.category),
            price: Number(p.price),
            image: String(p.image),
            rating: Number(p.rating) || 5,
            description: String(p.description ?? ""),
          }))
        );
      });

    return () => {
      active = false;
    };
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(allProducts.map((p) => p.category))),
  ];

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allProducts.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);
      const matchesCategory = category === "All" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, search, category]);

  return (
    <MenuContext.Provider
      value={{
        products: filteredProducts,
        search,
        category,
        setSearch,
        setCategory,
        categories,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error("useMenu must be used inside MenuProvider");
  return context;
}
