import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import SearchBar from "@/components/menu/SearchBar";
import CategoryFilter from "@/components/menu/CategoryFilter";
import MenuGrid from "@/components/menu/MenuGrid";

export default function MenuPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold">Our Menu</h1>
          <p className="mt-2 text-gray-600">Fresh meals made for every craving.</p>
        </div>
        <SearchBar />
        <CategoryFilter />
        <MenuGrid />
      </main>
      <Footer />
    </>
  );
}