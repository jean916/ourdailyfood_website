import Link from "next/link";

export default function SpecialOffers() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="rounded-3xl bg-yellow-400 p-10 md:p-14">
        <p className="font-bold uppercase tracking-widest">Special Offer</p>
        <h2 className="mt-3 text-4xl font-extrabold">Hungry? Let's make it delicious.</h2>
        <p className="mt-3 max-w-2xl">Explore today's meals and find something you'll love.</p>
        <Link href="/menu" className="mt-7 inline-block rounded-xl bg-black px-7 py-3 font-bold text-white hover:bg-gray-800">
          Order Now
        </Link>
      </div>
    </section>
  );
}