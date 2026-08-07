"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Magnetic } from "@/components/ui/magnetic-cursor";

const WHATSAPP_NUMBER = "5521998567051";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20JM%20MASTER%20GROUP%20e%20gostaria%20de%20saber%20mais%20sobre%20as%20solu%C3%A7%C3%B5es.`;

const NAV_LINKS = [
  { label: "Sobre Nós", href: "#sobre" },
  { label: "Metodologia", href: "#metodologia" },
  { label: "Soluções", href: "#solucoes" },
  { label: "Clientes", href: "#clientes" },
  { label: "Contato", href: "#contato" },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (href: string) => {
    setActiveLink(href);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-2 sm:top-4 inset-x-0 z-50 px-3 sm:px-6 md:px-8 lg:px-12 max-w-[1440px] mx-auto pointer-events-none">
      <nav
        className={`pointer-events-auto w-full rounded-2xl sm:rounded-full transition-all duration-300 ease-out px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between relative overflow-hidden ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgba(8,43,97,0.08)] ring-1 ring-black/5"
            : "bg-white/65 backdrop-blur-lg border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        }`}
      >
        {/* Subtle Ambient Light Shimmer inside Navbar */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E64F14]/20 to-transparent" />

        {/* Logo Oficial JM MASTER GROUP */}
        <Magnetic intensity={0.2}>
          <a href="#" className="flex items-center group py-0.5" aria-label="JM Master Group Home">
            <Logo size="md" variant="full" />
          </a>
        </Magnetic>

        {/* Desktop Navigation Links with Frosted Pill Effect */}
        <div className="hidden lg:flex items-center space-x-1 bg-slate-900/5 p-1.5 rounded-full border border-slate-900/5 backdrop-blur-md">
          {NAV_LINKS.map((link) => (
            <Magnetic key={link.label} intensity={0.2}>
              <a
                href={link.href}
                onClick={() => handleLinkClick(link.href)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  activeLink === link.href
                    ? "text-[#E64F14] bg-white shadow-xs font-black"
                    : "text-slate-700 hover:text-[#E64F14] hover:bg-white/60"
                }`}
              >
                {link.label}
              </a>
            </Magnetic>
          ))}
        </div>

        {/* CTA Button Desktop & Tablet */}
        <div className="hidden sm:flex items-center space-x-3">
          <Magnetic intensity={0.25}>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center space-x-2 bg-gradient-to-r from-[#E64F14] via-[#F06228] to-[#C43E0A] hover:from-[#c43e0a] hover:to-[#E64F14] text-white text-xs font-extrabold tracking-wider uppercase px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-full transition-all duration-200 shadow-md shadow-[#E64F14]/20 hover:shadow-lg hover:shadow-[#E64F14]/30 hover:scale-[1.02] active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">Falar no WhatsApp</span>
              <span className="md:hidden">WhatsApp</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </Magnetic>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-slate-900/5 border border-slate-900/10 text-slate-800 hover:text-[#E64F14] active:scale-95 transition-all focus:outline-none flex items-center justify-center"
          aria-label={mobileMenuOpen ? "Fechar Menu" : "Abrir Menu"}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto lg:hidden mt-2 w-full bg-white/90 backdrop-blur-2xl rounded-2xl border border-white/90 p-4 shadow-xl space-y-3 ring-1 ring-black/5"
          >
            <div className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={`text-xs font-black py-3 px-4 rounded-xl transition-all uppercase tracking-wider ${
                    activeLink === link.href
                      ? "bg-[#E64F14]/10 text-[#E64F14]"
                      : "text-slate-800 hover:text-[#E64F14] hover:bg-slate-50 active:bg-slate-100"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-[#E64F14] to-[#C43E0A] text-white font-extrabold text-xs uppercase tracking-wider w-full py-3.5 rounded-xl shadow-md shadow-[#E64F14]/25 active:scale-98 transition-transform"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Falar no WhatsApp</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
