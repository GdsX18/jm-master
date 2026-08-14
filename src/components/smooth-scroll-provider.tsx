"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Desativa o Lenis se estiver em qualquer rota do Painel / CRM para garantir scroll nativo 100% livre
    if (pathname?.startsWith("/painel")) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    // Inicialização calibrada do Lenis oficial
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9, // Calibração para evitar aceleração excessiva em mouses físicos e monitores de alta frequência
      touchMultiplier: 1.0,
      syncTouch: false, // Dispositivos touch (mobile/tablet) utilizam scroll nativo sem travamentos
      autoRaf: false,
    });

    lenisRef.current = lenis;

    // Conexão com o loop RAF
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Suporte aprimorado para links âncora (#sobre, #metodologia, etc.) com offset para compensar a navbar
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Se for um link âncora interno (ex: #solucoes ou /#solucoes estando na home)
      const hashIndex = href.indexOf("#");
      if (hashIndex !== -1) {
        const hash = href.substring(hashIndex);
        const path = href.substring(0, hashIndex);

        const isCurrentPage = path === "" || path === "/" || path === pathname;
        if (isCurrentPage && hash.length > 1) {
          const targetEl = document.querySelector(hash);
          if (targetEl) {
            e.preventDefault();
            lenis.scrollTo(targetEl as HTMLElement, {
              offset: -80, // Compensação da barra de navegação flutuante
              duration: 1.2,
            });
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  return <>{children}</>;
};

export default SmoothScrollProvider;
