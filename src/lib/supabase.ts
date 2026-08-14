import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Cliente para uso no navegador (Client Components)
export const supabaseClient = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'dummy'
);

// Cliente administrativo para uso em rotas de API do backend (Server-side)
export const supabaseAdmin = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseServiceKey || supabaseAnonKey || 'dummy',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Faz upload de um arquivo para o Supabase Storage
 * @param file Buffer ou Blob do arquivo
 * @param filename Nome do arquivo com extensão
 * @param bucket Nome do bucket (padrão: 'blog-images')
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

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(cleanFileName, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('[Supabase Storage Upload Error]:', error);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(cleanFileName);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    console.error('[Supabase Storage Error]:', err);
    return { success: false, error: err.message || 'Erro no upload' };
  }
}
