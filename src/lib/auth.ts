// Sessão assinada (HMAC-SHA256) via Web Crypto — funciona tanto no middleware quanto nas rotas de API.

export const SESSION_COOKIE = 'jm_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 horas

// Perfil com acesso restrito ao módulo de blog
export const BLOG_ONLY_ROLE = 'Criador de Blog';

export interface SessionPayload {
  uid: string;
  role: string;
  exp: number;
}

const encoder = new TextEncoder();

function getSecret(): string {
  // AUTH_SECRET é o recomendado; DATABASE_URL serve de fallback para não derrubar o login se a variável faltar
  const secret = process.env.AUTH_SECRET || process.env.DATABASE_URL;
  if (!secret) {
    throw new Error('AUTH_SECRET não configurado');
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(uid: string, role: string): Promise<string> {
  const payload: SessionPayload = {
    uid,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await getKey(),
      fromBase64Url(signature),
      encoder.encode(body)
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (!payload.uid || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}
