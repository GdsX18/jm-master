"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Menu, X, ArrowUpRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Magnetic } from "@/components/ui/magnetic-cursor";

const WHATSAPP_NUMBER = "5521951011616";
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
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-4 inset-x-0 z-50 px-4 md:px-8 lg:px-12 max-w-[1440px] mx-auto pointer-events-none">
      <nav
        className={`pointer-events-auto w-full rounded-full transition-all duration-500 ease-out px-5 py-2.5 md:px-7 md:py-3 flex items-center justify-between relative overflow-hidden ${
          scrolled
            ? "bg-white/65 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_rgba(8,43,97,0.12)] ring-1 ring-black/5"
            : "bg-white/50 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        }`}
      >
        {/* Subtle Ambient Light Shimmer inside Navbar */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E64F14]/20 to-transparent" />

        {/* Logo Oficial JM MASTER GROUP */}
        <Magnetic intensity={0.2}>
          <a href="#" className="flex items-center group">
            <Logo size="md" variant="full" />
          </a>
        </Magnetic>

        {/* Desktop Navigation Links with Frosted Pill Effect */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-900/5 p-1.5 rounded-full border border-slate-900/5 backdrop-blur-md">
          {NAV_LINKS.map((link) => (
            <Magnetic key={link.label} intensity={0.2}>
              <a
                href={link.href}
                onClick={() => setActiveLink(link.href)}
                className={`relative px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeLink === link.href
                    ? "text-[#E64F14] bg-white shadow-sm font-extrabold"
                    : "text-slate-700 hover:text-[#E64F14] hover:bg-white/70"
                }`}
              >
                {link.label}
              </a>
            </Magnetic>
          ))}
        </div>

        {/* CTA Button Desktop */}
        <div className="hidden md:flex items-center space-x-3">
          <Magnetic intensity={0.3}>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center space-x-2.5 bg-gradient-to-r from-[#E64F14] via-[#F06228] to-[#C43E0A] hover:from-[#c43e0a] hover:to-[#E64F14] text-white text-xs font-black tracking-wider uppercase px-5 py-2.5 md:px-6 md:py-3 rounded-full transition-all duration-300 shadow-md shadow-[#E64F14]/25 hover:shadow-xl hover:shadow-[#E64F14]/45 hover:scale-[1.03] active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span>Falar no WhatsApp</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </Magnetic>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2.5 rounded-full bg-slate-900/5 border border-slate-900/10 text-slate-800 hover:text-[#E64F14] transition-colors focus:outline-none"
          aria-label="Abrir Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto lg:hidden mt-3 w-full bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 shadow-2xl space-y-4 ring-1 ring-black/5"
          >
            <div className="flex flex-col space-y-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => {
                    setActiveLink(link.href);
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-black text-slate-800 hover:text-[#E64F14] py-3 px-4 rounded-xl hover:bg-white/60 transition-all uppercase tracking-wider"
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
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-[#E64F14] to-[#C43E0A] text-white font-extrabold text-xs uppercase tracking-wider w-full py-3.5 rounded-full shadow-lg shadow-orange-950/20 active:scale-95 transition-transform"
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
