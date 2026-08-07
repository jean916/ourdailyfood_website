import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto bg-black px-6 py-12 text-white">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row">
        <div>
          <Link href="/" className="text-2xl font-extrabold text-yellow-400">OurDailyFood</Link>
          <p className="mt-2 text-gray-400">Fresh meals delivered across Rwanda.</p>
        </div>
        <div className="flex gap-6 text-gray-300">
          <Link href="/menu" className="hover:text-yellow-400">Menu</Link>
          <Link href="/about" className="hover:text-yellow-400">About</Link>
          <Link href="/contact" className="hover:text-yellow-400">Contact</Link>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-7xl border-t border-gray-800 pt-6 text-sm text-gray-500">
        © {new Date().getFullYear()} OurDailyFood. All rights reserved.
      </p>
    </footer>
  );
}