'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToCustomersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/painel/customers');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-master-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-neutral-500 dark:text-master-textMuted animate-pulse">Redirecionando para a nova central de clientes...</p>
      </div>
    </div>
  );
}
