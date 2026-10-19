// Copia todos os arquivos do Supabase Storage para o disco (driver local de src/lib/storage.ts).
// Grava cada arquivo em STORAGE_DIR/<bucket>/<caminho> com um ".meta.json" (Content-Type) ao lado.
// É idempotente: arquivos já copiados com o mesmo tamanho são pulados, então pode rodar de novo
// logo antes da virada para pegar o que foi enviado depois da primeira cópia.
//
// Precisa de: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e STORAGE_DIR.
// Uso na VPS:  docker compose --env-file .env.production run --rm migrate node scripts/migrate/storage-from-supabase.mjs
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

const BUCKETS = ['blog-images', 'customer-documents'];
const SAFE_SEGMENT = /^[\w.-]+$/;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageDir = path.resolve(process.env.STORAGE_DIR || 'storage');
if (!url || !key) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (do projeto Supabase antigo).');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// list() não é recursivo: itens sem id são pastas
async function listAll(bucket, prefix = '') {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.name === '.emptyFolderPlaceholder') continue;
      if (item.id === null) files.push(...(await listAll(bucket, full)));
      else files.push({ path: full, size: item.metadata?.size ?? null, contentType: item.metadata?.mimetype });
    }
    if (data.length < 1000) break;
  }
  return files;
}

let copied = 0;
let skipped = 0;
const problems = [];

for (const bucket of BUCKETS) {
  const files = await listAll(bucket).catch((error) => {
    problems.push(error.message);
    return [];
  });
  console.log(`\n${bucket}: ${files.length} arquivo(s)`);

  for (const file of files) {
    // O driver local só serve nomes com [\w.-]; anote os que fugirem disso para renomear à mão
    if (!file.path.split('/').every((s) => SAFE_SEGMENT.test(s))) {
      problems.push(`${bucket}/${file.path}: nome com caracteres não suportados`);
      continue;
    }
    const target = path.join(storageDir, bucket, ...file.path.split('/'));
    const existing = await fs.stat(target).catch(() => null);
    if (existing && file.size !== null && existing.size === file.size) {
      skipped++;
      continue;
    }

    const { data, error } = await supabase.storage.from(bucket).download(file.path);
    if (error) {
      problems.push(`${bucket}/${file.path}: ${error.message}`);
      continue;
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, Buffer.from(await data.arrayBuffer()));
    await fs.writeFile(`${target}.meta.json`, JSON.stringify({ contentType: file.contentType || data.type || 'application/octet-stream' }));
    copied++;
    process.stdout.write('.');
  }
}

console.log(`\n\nCopiados: ${copied} | já existentes: ${skipped} | destino: ${storageDir}`);
if (problems.length) {
  console.log(`\n⚠ ${problems.length} problema(s):`);
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
