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
  // Quadruplicamos a lista para garantir um fluxo contínuo e sem interrupções
  const logosList = [
    ...MARCAS_LOGOS,
    ...MARCAS_LOGOS,
    ...MARCAS_LOGOS,
    ...MARCAS_LOGOS,
  ];

  return (
    <div className="w-full overflow-hidden py-10 relative">
      {/* Máscaras de Gradiente Suave nas Laterais */}
      <div className="absolute left-0 top-0 bottom-0 w-28 md:w-40 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-28 md:w-40 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

      {/* Marquee de Rolagem Contínua (Sem Pausa no Hover) */}
      <div className="animate-marquee flex items-center space-x-8 md:space-x-12">
        {logosList.map((marca, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center flex-shrink-0 w-36 md:w-44 h-16 transition-transform duration-300 hover:scale-110"
          >
            <Image
              src={marca.src}
              alt={marca.alt}
              width={200}
              height={60}
              className="h-12 md:h-14 w-auto object-contain brightness-0 opacity-85 hover:opacity-100 transition-all duration-300 filter drop-shadow-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
