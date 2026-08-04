"use client";

import React, { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    let lenis: Lenis | null = null;
    let rafId: number | null = null;

    if (typeof window !== "undefined") {
      try {
        lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 2,
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
