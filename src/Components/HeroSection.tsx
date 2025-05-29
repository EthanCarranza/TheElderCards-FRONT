import React from "react";

interface HeroSectionProps {
  title: string;
  image: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ title, image }) => (
  <>
    <div className="text-white text-center mt-8">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
    </div>
    <div className="flex justify-center mt-8">
      <img src={image} alt="hero" className="w-full" />
    </div>
  </>
);

export default HeroSection;
