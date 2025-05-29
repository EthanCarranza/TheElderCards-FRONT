import Navbar from "./Navbar";
import Footer from "./Footer";
import SideBanner from "./SideBanner";
import HeroSection from "./HeroSection";

function Landing() {
  return (
    <div className="relative min-h-screen bg-cover bg-center">
      <div className="flex">
        <SideBanner image="/bg.webp" position="left" />
        <div className="w-4/6 bg-black bg-opacity-90 min-h-screen">
          <Navbar />
          <HeroSection title="¡Bienvenido a Elder Cards!" image="hero.jpg" />
          <HeroSection title="¡Colecciona cartas!" image="hero.jpg" />
          <HeroSection title="¡Crea tus propias cartas!" image="hero.jpg" />
          <Footer />
        </div>
        <SideBanner image="/bg.webp" position="right" />
      </div>
    </div>
  );
}

export default Landing;
