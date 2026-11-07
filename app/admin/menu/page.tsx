"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/orders";

interface ProductRow {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  available: boolean;
}

const KNOWN_IMAGES = [
  "burger-classic.jpg",
  "burrito-chicken.jpg",
  "chicken-salad.jpg",
  "coca-cola.jpg",
  "fried-rice-beef.jpg",
  "fries.jpg",
  "hotdog-classic.jpg",
  "mango-juice.jpg",
];

export default function AdminMenuPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, price, image, description, available")
      .order("id");

    if (error) {
      setMessage(
        "We couldn't load the menu. Make sure the products table exists (run the SQL setup)."
      );
    } else {
      const rows = (data ?? []) as ProductRow[];
      setProducts(rows);
      setPrices(Object.fromEntries(rows.map((p) => [p.id, String(p.price)])));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("products").insert({
      name: String(formData.get("name") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      price: Number(formData.get("price")),
      image: String(formData.get("image") || "").trim(),
      description: String(formData.get("description") || "").trim(),
    });

    setSaving(false);

    if (error) {
      setMessage("The item could not be added. Check the values and try again.");
      return;
    }

    form.reset();
    setMessage("Item added.");
    await load();
  }

  async function updateProduct(id: number, changes: Partial<ProductRow>, done: string) {
    setMessage("");
    const { error } = await supabase.from("products").update(changes).eq("id", id);

    if (error) {
      setMessage("The change could not be saved.");
      return;
    }

    setMessage(done);
    await load();
  }

  async function removeProduct(id: number, name: string) {
    if (!window.confirm(`Remove "${name}" from the menu?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      setMessage("The item could not be removed.");
      return;
    }

    setMessage("Item removed.");
    await load();
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-yellow-400";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-extrabold">Menu management</h1>
        <p className="mt-2 text-gray-600">Add, price, hide or remove food items.</p>

        {message && (
          <p role="status" className="mt-6 rounded-xl border bg-white p-4 text-gray-800">
            {message}
          </p>
        )}

        <form onSubmit={handleAdd} className="mt-8 grid gap-4 rounded-2xl border bg-white p-6 shadow-sm sm:grid-cols-2">
          <h2 className="text-xl font-bold sm:col-span-2">Add a food item</h2>
          <input name="name" required minLength={2} maxLength={100} placeholder="Name" className={inputClass} />
          <input name="category" required maxLength={50} placeholder="Category (Burger, Drinks...)" className={inputClass} />
          <input name="price" type="number" required min={1} step={1} placeholder="Price (RWF)" className={inputClass} />
          <div>
            <input
              name="image"
              required
              list="known-images"
              defaultValue="/images/products/burger-classic.jpg"
              placeholder="/images/products/your-photo.jpg"
              className={inputClass}
            />
            <datalist id="known-images">
              {KNOWN_IMAGES.map((file) => (
                <option key={file} value={`/images/products/${file}`} />
              ))}
            </datalist>
          </div>
          <textarea name="description" required minLength={5} maxLength={500} rows={2} placeholder="Short description" className={`${inputClass} sm:col-span-2`} />
          <p className="text-xs text-gray-500 sm:col-span-2">
            To use a new photo, copy it into public/images/products and type its path above.
          </p>
          <button
            disabled={saving}
            className="rounded-xl bg-yellow-400 px-8 py-3 font-bold hover:bg-yellow-500 disabled:opacity-60 sm:col-span-2 sm:w-fit"
          >
            {saving ? "Adding..." : "Add item"}
          </button>
        </form>

        {loading ? (
          <p className="mt-8">Loading menu...</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-4 font-semibold">{p.name}</td>
                    <td className="p-4">{p.category}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={prices[p.id] ?? ""}
                          onChange={(e) => setPrices({ ...prices, [p.id]: e.target.value })}
                          className="w-28 rounded-lg border border-gray-300 p-2"
                        />
                        <button
                          onClick={() => updateProduct(p.id, { price: Number(prices[p.id]) }, "Price saved.")}
                          disabled={Number(prices[p.id]) === p.price || Number(prices[p.id]) < 1}
                          className="rounded-lg bg-yellow-400 px-3 py-2 font-bold hover:bg-yellow-500 disabled:opacity-40"
                        >
                          Save
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">{money(p.price)}</span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          updateProduct(
                            p.id,
                            { available: !p.available },
                            p.available ? "Item hidden." : "Item is available again."
                          )
                        }
                        className={`rounded-full px-4 py-1 text-xs font-bold ${
                          p.available ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {p.available ? "Available (hide)" : "Hidden (show)"}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => removeProduct(p.id, p.name)}
                        className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
