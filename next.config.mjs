// Slugs antigos de posts renomeados (ainda referenciados como canonical e possivelmente compartilhados)
const LEGACY_BLOG_SLUGS = [
  ["reativacao-de-base-de-clientes-a-mina-de-ouro-que-quase-ninguem-trabalha", "base-de-clientes-reativacao"],
  ["o-cliente-nao-manda-mensagem-para-reclamar-ele-simplesmente-vai-embora", "churn-silencioso-clientes-atendimento"],
  ["automacao-no-atendimento-o-que-muda-para-o-cliente-e-para-o-seu-time", "automacao-atendimento-cliente"],
  ["como-uma-clinica-estetica-reduziu-o-no-show-em-61-e-reativou-31-da-base-inativa", "case-clinica-estetica-no-show-reativacao"],
  ["por-que-responder-rapido-vale-mais-do-que-qualquer-script-de-vendas", "velocidade-resposta-lead-conversao"],
  ["as-3-coisas-que-toda-operacao-de-atendimento-que-converte-bem-tem-em-comum", "operacao-atendimento-que-converte"],
  ["reativar-custa-5-vezes-menos-do-que-adquirir-mas-quase-ninguem-faz-isso-de-forma-sistematica", "reativacao-clientes-inativos-campanha"],
  ["como-uma-concessionaria-aumentou-38-no-agendamento-de-revisoes-em-30-dias", "case-concessionaria-agendamento-de-revisoes"],
  ["como-saber-se-a-sua-operacao-de-atendimento-esta-pronta-para-escalar", "diagnostico-operacao-atendimento-escalar"],
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Build da VPS (Dockerfile define NEXT_OUTPUT=standalone); na Vercel fica o padrão
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  transpilePackages: ["framer-motion", "lucide-react"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  async redirects() {
    return LEGACY_BLOG_SLUGS.map(([from, to]) => ({
      source: `/blog/${from}`,
      destination: `/blog/${to}`,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Área administrativa e API nunca devem aparecer no Google
        source: "/painel/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
