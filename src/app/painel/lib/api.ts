// Cliente HTTP do painel: devolve o JSON ou lança Error com a mensagem do servidor.
// Sessão expirada (401) leva para o login preservando a tela atual.

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = any>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, {
      cache: 'no-store',
      ...rest,
      headers: json !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError('Sem conexão com o servidor. Verifique sua internet e tente novamente.', 0);
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && typeof window !== 'undefined' && !url.startsWith('/api/auth/')) {
    try {
      localStorage.removeItem('@JMMaster:user');
    } catch {}
    window.location.href = `/painel/login?next=${encodeURIComponent(window.location.pathname)}`;
  }

  if (!res.ok || data?.success === false) {
    throw new ApiError(data?.error || data?.message || `Erro ${res.status}`, res.status);
  }
  return data as T;
}

export function qs(params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}
