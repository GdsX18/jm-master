import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { MetodologiaSection } from "@/components/metodologia-section";
import { SolucoesSection } from "@/components/solucoes-section";
import { DepoimentosSection } from "@/components/depoimentos-section";
import { ClientesSection } from "@/components/clientes-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen relative z-10">
      <Navbar />
      <HeroSection />
      <MetodologiaSection />
      <SolucoesSection />
      <DepoimentosSection />
      <ClientesSection />
      <Footer />
    </main>
  );
}

