"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  useEffect(() => {
    // Desativa o Lenis se estiver em qualquer rota do Painel / CRM para permitir scroll nativo 100% livre
    if (pathname?.startsWith("/painel")) {
      return;
    }

    let lenisInstance: { raf: (time: number) => void; destroy: () => void } | null = null;
    let rafId: number | null = null;

    if (typeof window !== "undefined") {
      const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window || window.innerWidth < 1024;
      if (isTouch) {
        return;
      }

      // Dynamic import seguro que nunca quebra o bundling do Webpack no Next.js
      import("@studio-freight/lenis")
        .then((LenisModule) => {
          const LenisConstructor = (LenisModule as unknown as { default?: new (options?: unknown) => typeof lenisInstance }).default || (LenisModule as unknown as new (options?: unknown) => typeof lenisInstance);

          if (typeof LenisConstructor === "function") {
            try {
              lenisInstance = new LenisConstructor({
                duration: 1.0,
                easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: "vertical",
                gestureOrientation: "vertical",
                smoothWheel: true,
                wheelMultiplier: 1,
              });

              const raf = (time: number) => {
                if (lenisInstance) {
                  lenisInstance.raf(time);
                  rafId = requestAnimationFrame(raf);
                }
              };

              rafId = requestAnimationFrame(raf);
            } catch (e) {
              console.warn("Lenis init error:", e);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenisInstance && typeof lenisInstance.destroy === "function") {
        lenisInstance.destroy();
        lenisInstance = null;
      }
    };
  }, [pathname]);

  return <>{children}</>;
};

export default SmoothScrollProvider;
