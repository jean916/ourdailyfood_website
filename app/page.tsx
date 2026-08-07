import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";
import FeaturedMeals from "@/components/home/FeaturedMeals";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import SpecialOffers from "@/components/home/SpecialOffers";
import Testimonials from "@/components/home/Testimonials";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Categories />
        <FeaturedMeals />
        <WhyChooseUs />
        <SpecialOffers />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}