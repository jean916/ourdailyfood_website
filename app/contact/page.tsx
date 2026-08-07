import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-5xl font-extrabold">Contact Us</h1>
        <p className="mt-4 text-gray-600">Have a question? We would love to hear from you.</p>
        <form className="mt-10 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
          <input className="w-full rounded-xl border p-4" placeholder="Your name" />
          <input className="w-full rounded-xl border p-4" type="email" placeholder="Email address" />
          <textarea className="min-h-40 w-full rounded-xl border p-4" placeholder="Message" />
          <button className="w-full rounded-xl bg-yellow-400 py-4 font-bold hover:bg-yellow-500">
            Send Message
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}