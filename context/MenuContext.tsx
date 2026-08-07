"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { products } from "@/data/products";
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

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);
      const matchesCategory = category === "All" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <MenuContext.Provider value={{
      products: filteredProducts,
      search,
      category,
      setSearch,
      setCategory,
      categories
    }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error("useMenu must be used inside MenuProvider");
  return context;
}