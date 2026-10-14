"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-4 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-4">Algo deu errado</h2>
      <p className="text-slate-600 mb-6">Não foi possível carregar esta página. Tente novamente em instantes.</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 rounded-full bg-[#E64F14] text-white font-medium hover:bg-[#cf4510] transition-colors"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-[#082B61] text-white font-medium hover:bg-[#082B61]/90 transition-colors"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
