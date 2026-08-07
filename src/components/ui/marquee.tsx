"use client";

import React from "react";
import Image from "next/image";

const MARCAS_LOGOS = [
  { src: "/Parceiros/Amor e Saude.png", alt: "Amor e Saúde" },
  { src: "/Parceiros/Andreta.png", alt: "Andreta" },
  { src: "/Parceiros/Atlas.png", alt: "Atlas" },
  { src: "/Parceiros/Automes Chevrolet.png", alt: "Automes Chevrolet" },
  { src: "/Parceiros/Codefy.png", alt: "Codefy" },
  { src: "/Parceiros/Dahruj.png", alt: "Dahruj" },
  { src: "/Parceiros/Dental Vidas.png", alt: "Dental Vidas" },
  { src: "/Parceiros/NicNet.png", alt: "NicNet" },
  { src: "/Parceiros/Rede Dor.png", alt: "Rede D'Or" },
];

export const Marquee: React.FC = () => {
  // Duplicamos com arrays controlados para loop contínuo leve e eficiente
  const logosList = [...MARCAS_LOGOS, ...MARCAS_LOGOS, ...MARCAS_LOGOS];

  return (
    <div className="w-full overflow-hidden py-6 sm:py-8 relative select-none">
      {/* Máscaras de Gradiente Suave nas Laterais */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 md:w-40 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 md:w-40 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

      {/* Marquee de Rolagem Contínua Acelerada por Hardware */}
      <div className="animate-marquee flex items-center space-x-6 sm:space-x-10 md:space-x-12">
        {logosList.map((marca, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center shrink-0 w-28 sm:w-36 md:w-44 h-12 sm:h-14 transition-transform duration-200 hover:scale-105"
          >
            <Image
              src={marca.src}
              alt={marca.alt}
              width={160}
              height={50}
              className="h-9 sm:h-11 md:h-12 w-auto object-contain brightness-0 opacity-80 hover:opacity-100 transition-opacity duration-200"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
