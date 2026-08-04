"use client";

import React from "react";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon" | "secondary" | "dark";
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  variant = "full",
  size = "md",
}) => {
  const heightClasses = {
    sm: "h-9 md:h-10",
    md: "h-11 md:h-12",
    lg: "h-14 md:h-16",
  };

  const logoFile =
    variant === "icon"
      ? "/logos/Icone.png"
      : variant === "secondary"
      ? "/logos/JM-Master-2.png"
      : "/logos/JM-Master-1.png";

  return (
    <div className={`relative flex items-center ${className}`}>
      <img
        src={logoFile}
        alt="JM MASTER GROUP — Comunicação que engaja e converte"
        className={`${heightClasses[size]} w-auto object-contain transition-transform duration-300 hover:scale-[1.02] ${
          variant === "dark" ? "brightness-0 invert" : ""
        }`}
      />
    </div>
  );
};
