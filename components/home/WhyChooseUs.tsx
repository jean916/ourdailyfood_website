export default function WhyChooseUs() {
  const items = [
    ["🥗", "Fresh Ingredients", "Quality ingredients in every meal."],
    ["⚡", "Fast Delivery", "Hot meals delivered quickly."],
    ["💰", "Great Prices", "Delicious food without breaking the bank."]
  ];

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-4xl font-extrabold">Why Choose Us?</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map(([icon, title, text]) => (
            <div key={title} className="rounded-2xl bg-gray-50 p-8 text-center shadow-sm">
              <div className="mb-5 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-3xl shadow-sm">
                  {icon}
                </div>
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="mt-2 text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}