import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-4">
      <h2 className="text-4xl font-bold mb-4">Página Não Encontrada</h2>
      <p className="text-slate-600 mb-6">A página que você está procurando não existe.</p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full bg-[#082B61] text-white font-medium hover:bg-[#082B61]/90 transition-colors"
      >
        Voltar para o início
      </Link>
    </div>
  );
}
