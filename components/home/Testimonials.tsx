import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { createSupabaseServerClient } from "@/lib/supabase-server";

interface Testimonial {
  quote: string;
  name: string;
  rating: number;
  avatarUrl?: string;
}

// Shown only until real customers have left feedback.
const SAMPLE_TESTIMONIALS: Testimonial[] = [
  { quote: "The food arrived hot and tasted amazing!", name: "Aline", rating: 5 },
  { quote: "Great prices and a very easy ordering experience.", name: "Eric", rating: 5 },
  { quote: "OurDailyFood is now my go-to for lunch.", name: "Kevin", rating: 5 },
];

async function loadTestimonials(): Promise<{ items: Testimonial[]; real: boolean }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("public_testimonials", { p_limit: 6 });

    if (error || !Array.isArray(data) || data.length === 0) {
      return { items: SAMPLE_TESTIMONIALS, real: false };
    }

    return {
      real: true,
      items: data.map((row) => ({
        quote: String(row.comment),
        name: String(row.first_name || "Customer"),
        rating: Number(row.rating) || 5,
        avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
      })),
    };
  } catch {
    return { items: SAMPLE_TESTIMONIALS, real: false };
  }
}

export default async function Testimonials() {
  const { items, real } = await loadTestimonials();

  return (
    <section className="bg-yellow-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-widest text-yellow-700">
            Testimonials
          </span>
          <h2 className="mt-2 text-4xl font-extrabold">What Customers Say</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Kind words from people who ordered with OurDailyFood.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6">
          {items.map((item, index) => (
            <figure
              key={`${item.name}-${index}`}
              className="relative flex w-full flex-col rounded-2xl border border-yellow-100 md:w-[22rem] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span
                aria-hidden="true"
                className="absolute right-6 top-2 font-serif text-7xl leading-none text-yellow-200"
              >
                “
              </span>

              <p className="text-lg text-yellow-500" aria-label={`${item.rating} out of 5 stars`}>
                {"★".repeat(item.rating)}
                <span className="text-gray-300">{"★".repeat(5 - item.rating)}</span>
              </p>

              <blockquote className="relative mt-4 flex-1 text-lg leading-8 text-gray-700">
                {item.quote}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
                <span className="rounded-full ring-2 ring-yellow-400">
                  <Avatar url={item.avatarUrl} name={item.name} size={44} />
                </span>
                <span>
                  <span className="block font-bold">{item.name}</span>
                  <span className="block text-xs text-gray-500">
                    {real ? "Verified order" : "Customer"}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/my-orders"
            className="inline-block rounded-xl bg-yellow-400 px-8 py-3 font-bold text-black hover:bg-yellow-500"
          >
            Share your experience
          </Link>
        </div>
      </div>
    </section>
  );
}
