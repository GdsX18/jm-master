import { BlogPost, BLOG_POSTS } from '@/data/posts';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'custom-posts.json');

// Garante que o arquivo JSON exista
function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = BLOG_POSTS.map(p => ({ ...p, status: 'published' as const }));
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[BlogStorage] Erro ao criar arquivo de posts:', err);
  }
}

// Retorna todos os posts (tanto padrão quanto customizados)
export function getStoredPosts(): BlogPost[] {
  try {
    ensureDataFile();
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: BlogPost[] = JSON.parse(fileData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[BlogStorage] Erro ao ler posts armazenados:', err);
  }
  return BLOG_POSTS.map(p => ({ ...p, status: 'published' as const }));
}

// Salva a lista completa de posts
export function saveStoredPosts(posts: BlogPost[]): boolean {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[BlogStorage] Erro ao salvar posts:', err);
    return false;
  }
}

// Retorna um post específico pelo slug
export function getPostBySlug(slug: string): BlogPost | undefined {
  const posts = getStoredPosts();
  return posts.find((p) => p.slug === slug);
}
