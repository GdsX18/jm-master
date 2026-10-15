'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToCustomersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/painel/customers');
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-jm-bg text-jm-fg">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-jm-primary border-t-transparent"></div>
        <p className="text-sm text-jm-muted">Redirecionando para a nova central de clientes...</p>
      </div>
    </div>
  );
}
