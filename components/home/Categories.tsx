import Link from "next/link";

const categories = ["Burger", "Burrito", "Hot Dog", "Salad", "Drinks", "Juice"];

export default function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="text-center text-3xl font-extrabold">Browse Categories</h2>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <Link key={category} href="/menu" className="rounded-2xl bg-white p-6 text-center font-bold shadow-sm hover:-translate-y-1 hover:shadow-md">
            {category}
          </Link>
        ))}
      </div>
    </section>
  );
}