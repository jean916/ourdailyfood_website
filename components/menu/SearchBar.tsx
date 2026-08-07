"use client";

import { Search } from "lucide-react";
import { useMenu } from "@/context/MenuContext";

export default function SearchBar() {
  const { search, setSearch } = useMenu();

  return (
    <div className="mb-6 relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        type="search"
        placeholder="Search meals..."
        className="w-full rounded-xl border border-gray-300 bg-white p-4 pl-12 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
      />
    </div>
  );
}