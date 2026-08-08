import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import SearchBar from "@/components/menu/SearchBar";
import CategoryFilter from "@/components/menu/CategoryFilter";
import MenuGrid from "@/components/menu/MenuGrid";

export default function MenuPage() {
  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* Page Header */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold">
            Our Menu
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Fresh meals made for every craving.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Categories */}
        <div className="mb-10">
          <CategoryFilter />
        </div>

        {/* Products */}
        <MenuGrid />
      </main>

      <Footer />
    </>
  );
}
