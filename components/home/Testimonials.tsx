const testimonials = [
  ["“The food arrived hot and tasted amazing!”", "Aline"],
  ["“Great prices and a very easy ordering experience.”", "Eric"],
  ["“OurDailyFood is now my go-to for lunch.”", "Kevin"]
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="text-center text-4xl font-extrabold">What Customers Say</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {testimonials.map(([quote, name]) => (
          <div key={name} className="rounded-2xl bg-white p-7 shadow-sm">
            <p className="text-lg leading-8 text-gray-700">{quote}</p>
            <p className="mt-5 font-bold">— {name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}