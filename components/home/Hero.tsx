import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-black px-6 py-24 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="font-semibold uppercase tracking-widest text-yellow-400">Fresh • Fast • Delicious</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight sm:text-6xl">
            Great food, <span className="text-yellow-400">delivered.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-gray-300">
            Discover delicious meals made with care and delivered across Rwanda.
          </p>
          <Link href="/menu" className="mt-8 inline-block rounded-xl bg-yellow-400 px-7 py-4 font-bold text-black hover:bg-yellow-500">
            Explore Menu
          </Link>
        </div>
        <div className="rounded-3xl bg-yellow-400 p-10 text-center">
          <img
            src="/images/products/Feast.png"
            alt="Fresh ingredient feast"
            className="mx-auto h-auto max-h-96 w-full rounded-2xl object-cover"
          />
        </div>
      </div>
    </section>
  );
}