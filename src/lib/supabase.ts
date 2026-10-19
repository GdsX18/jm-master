import { createClient } from '@supabase/supabase-js';

// Uso exclusivo no servidor, e só pelo driver "supabase" de src/lib/storage.ts.
// O navegador nunca fala direto com o Supabase: todas as tabelas têm RLS ativo sem policies,
// então a chave anônima não lê nem grava nada.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (typeof window === 'undefined' && process.env.STORAGE_DRIVER !== 'local' && !supabaseServiceKey) {
  console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY ausente: uploads e documentos não vão funcionar.');
}

// Cliente administrativo para uso em rotas de API do backend (Server-side)
export const supabaseAdmin = createClient(supabaseUrl || 'http://localhost:54321', supabaseServiceKey || 'dummy', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
