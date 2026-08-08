import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";
import ProductDetails from "@/components/product/ProductDetails";
import { products } from "@/data/products";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return products.map((product) => ({
    id: String(product.id),
  }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = products.find(
    (item) => item.id === Number(id)
  );

  if (!product) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16">
        <ProductDetails product={product} />
      </main>

      <Footer />
    </>
  );
}
