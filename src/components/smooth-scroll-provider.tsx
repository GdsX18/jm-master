"use client";

import React, { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    let lenis: Lenis | null = null;
    let rafId: number | null = null;

    if (typeof window !== "undefined") {
      const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
      if (isTouch) {
        return; // Usa scroll nativo ultrarrápido em celulares e tablets
      }

      try {
        lenis = new Lenis({
          duration: 0.9,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 1,
        });

        function raf(time: number) {
          if (lenis) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
          }
        }

        rafId = requestAnimationFrame(raf);
      } catch (e) {
        console.error("Lenis init error:", e);
      }
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) {
        lenis.destroy();
        lenis = null;
      }
    };
  }, []);

  return <>{children}</>;
};
