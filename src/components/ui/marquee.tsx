"use client";

import React from "react";
import Image from "next/image";

const MARCAS_LOGOS = [
  { src: "/logos/Marca JM Master 1.png", alt: "Marca JM Master 1" },
  { src: "/logos/Marca JM Master 2.png", alt: "Marca JM Master 2" },
  { src: "/logos/Marca JM Master 3.png", alt: "Marca JM Master 3" },
  { src: "/logos/Marca JM Master 4.png", alt: "Marca JM Master 4" },
  { src: "/logos/JM-Master-2.png", alt: "JM Master 2" },
  { src: "/logos/Icone.png", alt: "JM Master Icone" },
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
      <div className="animate-marquee flex items-center space-x-14 md:space-x-20">
        {logosList.map((marca, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110"
          >
            <Image
              src={marca.src}
              alt={marca.alt}
              width={160}
              height={48}
              className="h-10 md:h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300 filter drop-shadow-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
