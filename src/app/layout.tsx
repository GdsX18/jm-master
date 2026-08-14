import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";
import { MagneticCursor } from "@/components/ui/magnetic-cursor";
import { TrackingScripts } from "@/components/tracking/tracking-scripts";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JM MASTER GROUP | Marketing Digital, Automação & Mensageria",
  description:
    "Elevando a presença digital do seu negócio com automações avançadas, inteligência conversacional, API Oficial do WhatsApp, SMS e E-mail Marketing.",
  keywords: [
    "JM MASTER GROUP",
    "Marketing Digital",
    "Automação WhatsApp",
    "API Oficial WhatsApp Meta",
    "Chatbot IA",
    "SMS Marketing",
    "Email Marketing",
  ],
  authors: [{ name: "JM MASTER GROUP" }],
  icons: {
    icon: [
      { url: "/logos/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logos/Icone.png", type: "image/png" },
    ],
    shortcut: "/logos/favicon-32x32.png",
    apple: [
      { url: "/logos/Icone.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "JM MASTER GROUP | Comunicação que engaja e converte",
    description:
      "Elevando a presença digital do seu negócio com automações avançadas, inteligência conversacional e alta performance de vendas.",
    type: "website",
    locale: "pt_BR",
    siteName: "JM MASTER GROUP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="antialiased selection:bg-[#E64F14] selection:text-white relative" suppressHydrationWarning>
        {/* Injeção Dinâmica de Pixels e Tags do Supabase */}
        <TrackingScripts />

        {/* Glow de Iluminação Decorativa de Fundo estilo Kinto.app */}
        <div className="ambient-glow" />

        <MagneticCursor />

        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
