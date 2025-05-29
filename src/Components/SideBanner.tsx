import React from "react";

interface SideBannerProps {
  image: string;
  position?: "left" | "right";
}

const SideBanner: React.FC<SideBannerProps> = ({ image, position = "left" }) => (
  <div
    className={`w-1/6 bg-black opacity-90 sticky top-0 bg-cover bg-center ${position === "right" ? "order-last" : ""}`}
    style={{ backgroundImage: `url('${image}')` }}
  ></div>
);

export default SideBanner;
