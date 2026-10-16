'use client';

import { useEffect, useState } from 'react';

// Lê os parâmetros da URL uma vez, no cliente (ex.: ?new=1 vindo das ações rápidas do dashboard).
// Evita useSearchParams, que exige Suspense nas páginas pré-renderizadas.
export function useQueryParams() {
  const [params, setParams] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);
  return params;
}

// Remove parâmetros já consumidos sem recarregar nem criar histórico
export function clearQueryParams(...keys: string[]) {
  const url = new URL(window.location.href);
  keys.forEach((k) => url.searchParams.delete(k));
  window.history.replaceState(null, '', url.pathname + url.search);
}
