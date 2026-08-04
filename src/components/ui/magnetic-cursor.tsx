"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export const MagneticCursor: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Valores de posição do mouse
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Mola suave para o cursor (Spring dynamics)
  const springConfig = { damping: 28, stiffness: 350, mass: 0.4 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);

    // Verificação de suporte a dispositivos touch ou telas menores
    const checkTouch = () => {
      const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
      setIsTouchDevice(isTouch);
    };
    checkTouch();

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);

        setIsVisible(true);

        const target = e.target as HTMLElement | null;
        if (target) {
          const isInteractive =
            target.closest("a, button, [data-magnetic], input, textarea, select, .magnetic-target") !== null;
          setIsHovered((prev) => (prev !== isInteractive ? isInteractive : prev));
        }
      });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  // Desativa a renderização durante SSR/Hydration inicial e em aparelhos touch
  if (!mounted || isTouchDevice) return null;

  return (
    <motion.div
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        scale: isHovered ? 1.3 : 1,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.2 }}
      className={`fixed top-0 left-0 pointer-events-none z-[9999] rounded-full hidden md:block mix-blend-difference bg-white ${
        isHovered ? "w-6 h-6 border border-white/60 shadow-sm" : "w-4 h-4"
      }`}
    />
  );
};

// Wrapper Component para Atração Magnética dos elementos
export const Magnetic: React.FC<{
  children: React.ReactNode;
  intensity?: number;
  className?: string;
}> = ({ children, intensity = 0.35, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const positionX = useMotionValue(0);
  const positionY = useMotionValue(0);

  const springConfig = { damping: 18, stiffness: 220, mass: 0.15 };
  const x = useSpring(positionX, springConfig);
  const y = useSpring(positionY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const middleX = e.clientX - (left + width / 2);
    const middleY = e.clientY - (top + height / 2);

    positionX.set(middleX * intensity);
    positionY.set(middleY * intensity);
  };

  const handleMouseLeave = () => {
    positionX.set(0);
    positionY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      className={`inline-block magnetic-target ${className}`}
      data-magnetic="true"
    >
      {children}
    </motion.div>
  );
};
