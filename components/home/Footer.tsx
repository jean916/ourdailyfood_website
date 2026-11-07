import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";

// Change these links to your real social media pages.
const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/ourdailyfood0",
  facebook: "https://www.facebook.com/ourdailyfood0",
  tiktok: "https://www.tiktok.com/@ourdailyfood0",
};

function TikTokIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const socialClass =
  "flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-gray-300 transition hover:bg-yellow-400 hover:text-black";

export default function Footer() {
  return (
    <footer className="mt-auto bg-black px-6 py-12 text-white">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row">
        <div>
          <Link href="/" className="text-2xl font-extrabold text-yellow-400">OurDailyFood</Link>
          <p className="mt-2 text-gray-400">Fresh meals delivered across Rwanda.</p>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-gray-300">Follow us</p>
            <div className="flex gap-3">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OurDailyFood on Instagram"
                className={socialClass}
              >
                <Instagram size={22} />
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OurDailyFood on Facebook"
                className={socialClass}
              >
                <Facebook size={22} />
              </a>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="OurDailyFood on TikTok"
                className={socialClass}
              >
                <TikTokIcon />
              </a>
            </div>
            <p className="mt-3 text-sm text-gray-500">@ourdailyfood_rw</p>
          </div>
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
