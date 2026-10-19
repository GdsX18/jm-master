import { createHmac, timingSafeEqual } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { supabaseAdmin } from './supabase';

// Armazenamento de arquivos com dois drivers, escolhidos por STORAGE_DRIVER:
//   supabase (padrão) — Supabase Storage, como na Vercel
//   local             — disco do servidor (VPS), em STORAGE_DIR; arquivos servidos por /files/[bucket]/...
// Todo o resto do sistema fala só com as funções deste arquivo.

export type StoredObject = { name: string; size: number; createdAt: string | null };

// Buckets lidos sem login. Os demais (ex.: customer-documents) só abrem com link assinado.
export const PUBLIC_BUCKETS = ['blog-images'];

export const STORAGE_DRIVER: 'supabase' | 'local' = process.env.STORAGE_DRIVER === 'local' ? 'local' : 'supabase';

export const STORAGE_LABEL =
  STORAGE_DRIVER === 'local' ? 'Armazenamento de arquivos (disco do servidor)' : 'Armazenamento de arquivos (Supabase Storage)';

const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || 'storage');

// ─── Caminhos ────────────────────────────────────────────────────────────────

const SAFE_SEGMENT = /^[\w.-]+$/;

// Aceita apenas "pasta/arquivo.ext" com segmentos simples: bloqueia "..", barras invertidas e caminhos absolutos.
// Os ".meta.json" são internos do driver local e nunca são servidos.
export function isSafeObjectPath(objectPath: string) {
  const segments = objectPath.split('/');
  return (
    !objectPath.endsWith('.meta.json') &&
    segments.every((s) => s !== '.' && s !== '..' && SAFE_SEGMENT.test(s))
  );
}

function localFilePath(bucket: string, objectPath: string) {
  if (!SAFE_SEGMENT.test(bucket) || !isSafeObjectPath(objectPath)) throw new Error('Caminho de arquivo inválido');
  return path.join(STORAGE_DIR, bucket, ...objectPath.split('/'));
}

export async function readLocalObject(bucket: string, objectPath: string) {
  const file = localFilePath(bucket, objectPath);
  const [bytes, meta] = await Promise.all([fs.readFile(file), readMeta(file)]);
  return { bytes, contentType: meta.contentType || 'application/octet-stream' };
}

// O tipo do arquivo fica num ".meta.json" ao lado (o disco não guarda Content-Type)
async function readMeta(file: string): Promise<{ contentType?: string }> {
  try {
    return JSON.parse(await fs.readFile(`${file}.meta.json`, 'utf8'));
  } catch {
    return {};
  }
}

// ─── Links assinados (driver local) ──────────────────────────────────────────

function signingSecret() {
  const secret = process.env.STORAGE_SIGNING_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error('STORAGE_SIGNING_SECRET/AUTH_SECRET não configurado');
  return secret;
}

function signature(bucket: string, objectPath: string, exp: number, download: string) {
  return createHmac('sha256', signingSecret()).update(`${bucket}/${objectPath}|${exp}|${download}`).digest('base64url');
}

export function verifySignedRequest(bucket: string, objectPath: string, params: URLSearchParams) {
  const exp = Number(params.get('exp'));
  const sig = params.get('sig') || '';
  const download = params.get('download') || '';
  if (!exp || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(signature(bucket, objectPath, exp, download));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function encodePath(objectPath: string) {
  return objectPath.split('/').map(encodeURIComponent).join('/');
}

// ─── Operações ───────────────────────────────────────────────────────────────

export async function putObject(bucket: string, objectPath: string, bytes: Buffer | Uint8Array, contentType: string) {
  if (STORAGE_DRIVER === 'local') {
    const file = localFilePath(bucket, objectPath);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, bytes, { flag: 'wx' });
    await fs.writeFile(`${file}.meta.json`, JSON.stringify({ contentType }));
    return;
  }
  const { error } = await supabaseAdmin.storage.from(bucket).upload(objectPath, bytes, { contentType, upsert: false });
  if (error) throw new Error(error.message);
}

// URL pública de um bucket público. No driver local é relativa ("/files/..."): não depende do domínio.
export function publicUrl(bucket: string, objectPath: string) {
  if (STORAGE_DRIVER === 'local') return `/files/${bucket}/${encodePath(objectPath)}`;
  return supabaseAdmin.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

// Link temporário para arquivo de bucket privado, já forçando o download com o nome original
export async function signedDownloadUrl(bucket: string, objectPath: string, expiresInSeconds: number, downloadName: string) {
  if (STORAGE_DRIVER === 'local') {
    await fs.access(localFilePath(bucket, objectPath));
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const sig = signature(bucket, objectPath, exp, downloadName);
    const qs = new URLSearchParams({ exp: String(exp), download: downloadName, sig });
    return `/files/${bucket}/${encodePath(objectPath)}?${qs}`;
  }
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresInSeconds, { download: downloadName });
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Arquivo indisponível');
  return data.signedUrl;
}

export async function removeObjects(bucket: string, objectPaths: string[]) {
  if (objectPaths.length === 0) return;
  if (STORAGE_DRIVER === 'local') {
    await Promise.all(
      objectPaths.flatMap((p) => {
        const file = localFilePath(bucket, p);
        return [fs.rm(file, { force: true }), fs.rm(`${file}.meta.json`, { force: true })];
      })
    );
    return;
  }
  const { error } = await supabaseAdmin.storage.from(bucket).remove(objectPaths);
  if (error) throw new Error(error.message);
}

// Lista os arquivos da raiz do bucket, mais recentes primeiro
export async function listObjects(bucket: string, { limit, offset }: { limit: number; offset: number }): Promise<StoredObject[]> {
  if (STORAGE_DRIVER === 'local') {
    const dir = path.join(STORAGE_DIR, bucket);
    const names = (await fs.readdir(dir).catch(() => [] as string[])).filter((n) => !n.endsWith('.meta.json'));
    const entries = await Promise.all(
      names.map(async (name) => {
        const stat = await fs.stat(path.join(dir, name));
        return stat.isFile() ? { name, size: stat.size, createdAt: stat.birthtime.toISOString(), time: stat.birthtimeMs } : null;
      })
    );
    return entries
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => b.time - a.time)
      .slice(offset, offset + limit)
      .map(({ name, size, createdAt }) => ({ name, size, createdAt }));
  }
  const { data, error } = await supabaseAdmin.storage.from(bucket).list('', {
    limit,
    offset,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) throw new Error(error.message);
  return (data || [])
    .filter((f) => f.id && f.name !== '.emptyFolderPlaceholder')
    .map((f) => ({
      name: f.name,
      size: (f.metadata as { size?: number } | null)?.size || 0,
      createdAt: f.created_at,
    }));
}

const readyBuckets = new Set<string>();
export async function ensureBucket(bucket: string, options: { public: boolean; fileSizeLimit?: number }) {
  if (readyBuckets.has(bucket)) return;
  if (STORAGE_DRIVER === 'local') {
    await fs.mkdir(path.join(STORAGE_DIR, bucket), { recursive: true });
  } else {
    const { data } = await supabaseAdmin.storage.getBucket(bucket);
    if (!data) {
      const { error } = await supabaseAdmin.storage.createBucket(bucket, options);
      if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
    }
  }
  readyBuckets.add(bucket);
}

// Usado no painel de saúde do dashboard
export async function checkStorage() {
  if (STORAGE_DRIVER === 'local') {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const probe = path.join(STORAGE_DIR, '.healthcheck');
    await fs.writeFile(probe, String(Date.now()));
    await fs.rm(probe, { force: true });
    return `Conectado (${STORAGE_DIR})`;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Chave de serviço não configurada');
  const { error } = await supabaseAdmin.storage.from('blog-images').list('', { limit: 1 });
  if (error) throw new Error(error.message);
  return 'Conectado';
}
