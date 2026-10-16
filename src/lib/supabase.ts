import { createClient } from '@supabase/supabase-js';

// Uso exclusivo no servidor (rotas de API). O navegador nunca fala direto com o Supabase:
// todas as tabelas têm RLS ativo sem policies, então a chave anônima não lê nem grava nada.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (typeof window === 'undefined' && !supabaseServiceKey) {
  console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY ausente: uploads e documentos não vão funcionar.');
}

// Cliente administrativo para uso em rotas de API do backend (Server-side)
export const supabaseAdmin = createClient(supabaseUrl || 'http://localhost:54321', supabaseServiceKey || 'dummy', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Faz upload de um arquivo para o Supabase Storage
 * @returns URL pública da imagem
 */
export async function uploadImageToStorage(
  file: Buffer | Blob | Uint8Array,
  filename: string,
  contentType: string = 'image/jpeg',
  bucket: string = 'blog-images'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const cleanFileName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { error } = await supabaseAdmin.storage.from(bucket).upload(cleanFileName, file, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error('[Supabase Storage Upload Error]:', error);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(cleanFileName);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    console.error('[Supabase Storage Error]:', err);
    return { success: false, error: err.message || 'Erro no upload' };
  }
}
