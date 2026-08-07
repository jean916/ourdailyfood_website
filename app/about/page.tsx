import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-5xl font-extrabold">About OurDailyFood</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          We make delicious, affordable meals easy to order and enjoy across Rwanda.
        </p>
      </main>
      <Footer />
    </>
  );
}